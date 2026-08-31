from __future__ import annotations

import asyncio
import logging
import uuid
from pathlib import Path

from app.core.config import get_settings
from app.core.enums import ExportFormat, ReportType
from app.schemas import RonaContextBundle
from app.services.reports.documents import build_document
from app.services.reports.errors import ReportError
from app.services.reports.models import EXTENSIONS, ReportDocument, ReportResult
from app.services.reports.renderers import render

logger = logging.getLogger(__name__)
class ReportService:
    def __init__(self, output_dir: str | Path | None = None) -> None:
        settings = get_settings()
        self._output_dir = Path(output_dir or settings.report_output_dir)
        self._output_dir.mkdir(parents=True, exist_ok=True)
        self._registry: dict[str, ReportResult] = {}

    async def render_bytes(
        self,
        *,
        bundle: RonaContextBundle,
        report_type: ReportType,
        export_format: ExportFormat,
    ) -> bytes:
        document = build_document(bundle, report_type)
        return await asyncio.to_thread(render, document, export_format)

    async def generate(
        self,
        *,
        bundle: RonaContextBundle,
        report_type: ReportType,
        export_format: ExportFormat,
    ) -> ReportResult:
        document = build_document(bundle, report_type)

        report_id = f"RPT-{report_type.value}-{uuid.uuid4().hex[:12]}"
        filename = f"{report_id}.{EXTENSIONS[export_format]}"
        path = self._output_dir / filename

        try:
            byte_size = await asyncio.to_thread(
                self._render_and_write, document, export_format, path
            )
        except ReportError:
            raise
        except Exception as exc:
            logger.error(
                "report rendering failed",
                exc_info=True,
                extra={"tenant_id": bundle.tenant_id, "report_type": report_type.value},
            )
            raise ReportError(f"Failed to render {export_format.value} report") from exc

        result = ReportResult(
            report_id=report_id,
            tenant_id=bundle.tenant_id,
            report_type=report_type,
            export_format=export_format,
            filename=filename,
            path=path,
            byte_size=byte_size,
            generated_at=document.generated_at,
        )
        self._registry[report_id] = result
        logger.info(
            "report generated",
            extra={
                "tenant_id": bundle.tenant_id,
                "report_id": report_id,
                "report_type": report_type.value,
                "format": export_format.value,
                "bytes": byte_size,
            },
        )
        return result

    def resolve_for_tenant(self, report_id: str, tenant_id: str) -> ReportResult | None:
        result = self._registry.get(report_id)
        if result is None or result.tenant_id != tenant_id:
            return None
        if not result.path.exists():
            return None
        return result

    @staticmethod
    def _render_and_write(
        document: ReportDocument, export_format: ExportFormat, path: Path
    ) -> int:
        data = render(document, export_format)
        path.write_bytes(data)
        return len(data)


_report_service: ReportService | None = None


def get_report_service() -> ReportService:
    global _report_service
    if _report_service is None:
        _report_service = ReportService()
    return _report_service


__all__ = ["ReportService", "get_report_service"]
