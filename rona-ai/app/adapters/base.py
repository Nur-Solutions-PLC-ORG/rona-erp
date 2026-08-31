
from __future__ import annotations

import asyncio
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone

from app.core.enums import DataDomain, Language, UserRole
from app.schemas import (
    CanonicalContext,
    FinanceContext,
    HRContext,
    InventoryContext,
    MaintenanceContext,
    PendingTask,
    PeriodSpec,
    ProcurementContext,
    ProductionContext,
    RonaContextBundle,
    SalesContext,
    SmartAlert,
    apply_record_cap,
    assert_tenant_match,
)

logger = logging.getLogger(__name__)


class AdapterError(RuntimeError):
    pass


class TenantNotFoundError(AdapterError):
    pass


class BaseRonaAdapter(ABC):


    source_system: str = "unknown"


    @abstractmethod
    async def fetch_hr(self, tenant_id: str, period: PeriodSpec) -> HRContext:
        pass

    @abstractmethod
    async def fetch_production(self, tenant_id: str, period: PeriodSpec) -> ProductionContext:
        pass

    @abstractmethod
    async def fetch_inventory(self, tenant_id: str, period: PeriodSpec) -> InventoryContext:
        pass

    @abstractmethod
    async def fetch_maintenance(self, tenant_id: str, period: PeriodSpec) -> MaintenanceContext:
        pass

    @abstractmethod
    async def fetch_finance(self, tenant_id: str, period: PeriodSpec) -> FinanceContext:
        pass

    @abstractmethod
    async def fetch_procurement(self, tenant_id: str, period: PeriodSpec) -> ProcurementContext:
        pass

    @abstractmethod
    async def fetch_sales(self, tenant_id: str, period: PeriodSpec) -> SalesContext:
        pass


    @abstractmethod
    async def fetch_alerts(
        self, tenant_id: str, period: PeriodSpec, domains: list[DataDomain]
    ) -> list[SmartAlert]:
        pass

    @abstractmethod
    async def fetch_pending_tasks(
        self, tenant_id: str, period: PeriodSpec, domains: list[DataDomain]
    ) -> list[PendingTask]:
        pass

    @abstractmethod
    async def fetch_tenant_name(self, tenant_id: str) -> str | None:
        pass

    async def health_check(self) -> bool:
        return True

    async def aclose(self) -> None:
        pass


    _DOMAIN_ROUTES: dict[DataDomain, tuple[str, str]] = {
        DataDomain.HR: ("fetch_hr", "hr"),
        DataDomain.ATTENDANCE: ("fetch_hr", "hr"),
        DataDomain.PRODUCTION: ("fetch_production", "production"),
        DataDomain.INVENTORY: ("fetch_inventory", "inventory"),
        DataDomain.MAINTENANCE: ("fetch_maintenance", "maintenance"),
        DataDomain.FINANCE: ("fetch_finance", "finance"),
        DataDomain.PROCUREMENT: ("fetch_procurement", "procurement"),
        DataDomain.SALES: ("fetch_sales", "sales"),
    }


    _NO_PAYLOAD_DOMAINS: frozenset[DataDomain] = frozenset({DataDomain.REPORTS})

    def __init_subclass__(cls, **kwargs: object) -> None:
        super().__init_subclass__(**kwargs)
        unhandled = [
            domain.value
            for domain in DataDomain
            if domain not in cls._DOMAIN_ROUTES and domain not in cls._NO_PAYLOAD_DOMAINS
        ]
        if unhandled:
            raise TypeError(
                f"{cls.__name__}: DataDomain(s) {', '.join(unhandled)} have no entry in "
                "_DOMAIN_ROUTES and are not listed in _NO_PAYLOAD_DOMAINS."
            )

    async def build_context_bundle(
        self,
        *,
        tenant_id: str,
        user_role: UserRole,
        granted_domains: list[DataDomain],
        denied_domains: list[DataDomain],
        period: PeriodSpec,
        language: Language | None = None,
        include_alerts: bool = True,
        include_pending_tasks: bool = False,
        tenant_name: str | None = None,
    ) -> RonaContextBundle:
        from app.core.config import get_settings  

        settings = get_settings()
        language = language or settings.default_language


        routes: dict[str, tuple[str, list[DataDomain]]] = {}
        for domain in granted_domains:
            route = self._DOMAIN_ROUTES.get(domain)
            if route is None:
                if domain not in self._NO_PAYLOAD_DOMAINS:
                    logger.error(
                        "granted domain has no fetch route and is not declared "
                        "payload less data will be missing",
                        extra={"tenant_id": tenant_id, "domain": domain.value},
                    )
                continue
            method_name, field_name = route
            routes.setdefault(method_name, (field_name, []))[1].append(domain)

        async def _run(method_name: str) -> CanonicalContext:
            method = getattr(self, method_name)
            return await method(tenant_id, period)

        method_names = list(routes.keys())


        results = await asyncio.gather(
            *(_run(name) for name in method_names), return_exceptions=True
        )

        bundle_kwargs: dict[str, object] = {}
        failed_domains: list[DataDomain] = []
        for method_name, result in zip(method_names, results):
            field_name, domains = routes[method_name]
            if isinstance(result, BaseException):

                failed_domains.extend(domains)
                logger.warning(
                    "adapter fetch failed",
                    extra={
                        "tenant_id": tenant_id,
                        "domain": field_name,
                        "error": f"{type(result).__name__}: {result}",
                    },
                )
                continue

            assert_tenant_match(result.tenant_id, tenant_id)


            bundle_kwargs[field_name] = apply_record_cap(
                result, settings.max_context_records_per_domain
            )

        alerts: list[SmartAlert] = []
        if include_alerts and granted_domains:
            try:
                fetched = await self.fetch_alerts(tenant_id, period, granted_domains)
            except Exception as exc:  
                logger.warning("alert fetch failed: %s", exc, extra={"tenant_id": tenant_id})
            else:
                granted_set = set(granted_domains)
                for alert in fetched:
                    if alert.domain not in granted_set:


                        logger.error(
                            "adapter returned an alert for an un-granted domain; dropped",
                            extra={
                                "tenant_id": tenant_id,
                                "domain": alert.domain.value,
                                "alert_id": alert.alert_id,
                            },
                        )
                        continue
                    alerts.append(alert)

        tasks: list[PendingTask] = []
        if include_pending_tasks and granted_domains:
            try:
                fetched_tasks = await self.fetch_pending_tasks(
                    tenant_id, period, granted_domains
                )
            except Exception as exc:  
                logger.warning("task fetch failed: %s", exc, extra={"tenant_id": tenant_id})
            else:
                granted_set = set(granted_domains)
                tasks = [task for task in fetched_tasks if task.domain in granted_set]

        if failed_domains:
            logger.error(
                "context bundle built with gaps",
                extra={
                    "tenant_id": tenant_id,
                    "failed": [d.value for d in failed_domains],
                },
            )

        if tenant_name is None:
            tenant_name = await self.fetch_tenant_name(tenant_id)

        return RonaContextBundle(
            tenant_id=tenant_id,
            tenant_name=tenant_name,
            user_role=user_role,
            language=language,
            granted_domains=granted_domains,
            denied_domains=denied_domains,
            period=period,
            generated_at=datetime.now(timezone.utc),
            failed_domains=failed_domains,
            alerts=alerts,
            pending_tasks=tasks,
            **bundle_kwargs,  
        )
