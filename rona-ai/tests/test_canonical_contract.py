
from __future__ import annotations

from datetime import date, datetime

import pytest
from pydantic import ValidationError

from app.core.enums import DataDomain, ProductionStatus, Shift, UserRole
from app.schemas import (
    HRContext,
    PeriodSpec,
    ProductionContext,
    ProductionLineRecord,
    RonaAIResponse,
    RonaContextBundle,
    SupportingMetric,
    assert_tenant_match,
)


_PERIOD = PeriodSpec.for_day(date(2026, 8, 11))


_UNSUPPORTED_HINT = (
    "google-genai response_schema does not support open-ended objects. "
    "Model the data as a list of typed records instead (see SupportingMetric)."
)


def _walk(node: object):
    if isinstance(node, dict):
        yield node
        for value in node.values():
            yield from _walk(value)
    elif isinstance(node, list):
        for item in node:
            yield from _walk(item)


def test_ai_response_has_no_open_ended_objects() -> None:
    schema = RonaAIResponse.model_json_schema()
    for node in _walk(schema):
        extra = node.get("additionalProperties")

        assert extra in (None, False), _UNSUPPORTED_HINT


def test_ai_response_every_property_is_typed() -> None:
    schema = RonaAIResponse.model_json_schema()
    for node in _walk(schema):
        for name, prop in node.get("properties", {}).items():
            assert prop, f"property {name!r} has an empty (Any) schema — {_UNSUPPORTED_HINT}"
            assert (
                {"type", "anyOf", "$ref", "enum", "items", "allOf"} & prop.keys()
            ), f"property {name!r} has no resolvable type"


def test_ai_response_matches_the_format_mandated_by_ai_txt() -> None:
    fields = RonaAIResponse.model_fields
    for required in ("answer", "supporting_data", "recommendation", "source"):
        assert required in fields, f"ai.txt response format requires {required!r}"


def test_ai_response_round_trips_a_realistic_answer() -> None:
    response = RonaAIResponse(
        answer="12 employees are absent today (6.2% of the workforce).",
        supporting_data=[
            SupportingMetric(label="Employees absent", value="12", comparison="+3 vs yesterday"),
            SupportingMetric(label="Absenteeism rate", value="6.2%"),
        ],
        recommendation="Reassign operators from Line 1 to maintain production targets.",
        source=[DataDomain.ATTENDANCE],
        data_available=True,
    )
    assert response.source == [DataDomain.ATTENDANCE]

    dumped = response.model_dump(mode="json")
    assert dumped["source"] == ["attendance"]
    assert dumped["supporting_data"][0]["value"] == "12"


def test_source_citations_are_restricted_to_real_modules() -> None:
    with pytest.raises(ValidationError):
        RonaAIResponse(answer="...", source=["astrology_module"])


def _production_context(tenant_id: str = "tenant-alpha") -> ProductionContext:
    return ProductionContext(
        tenant_id=tenant_id,
        domain=DataDomain.PRODUCTION,
        period_label="11 Aug 2026",
        period_start=date(2026, 8, 11),
        period_end=date(2026, 8, 11),
        generated_at=datetime(2026, 8, 11, 9, 0, 0),
        total_target_units=5000,
        total_produced_units=4400,
        overall_efficiency_pct=88.0,
        target_achievement_pct=88.0,
        overall_status=ProductionStatus.BELOW_TARGET,
        lines=[
            ProductionLineRecord(
                line_id="L1",
                line_name="Line 1",
                product="Steel Frames",
                shift=Shift.MORNING,
                target_units=2500,
                produced_units=2450,
                efficiency_pct=98.0,
                status=ProductionStatus.ON_TARGET,
            )
        ],
    )


def test_unknown_erp_field_is_rejected_not_ignored() -> None:
    with pytest.raises(ValidationError):
        ProductionLineRecord(
            line_id="L1",
            line_name="Line 1",
            product="Steel Frames",
            shift=Shift.MORNING,
            target_units=100,
            produced_units=90,
            efficiency_pct=90.0,
            status=ProductionStatus.ON_TARGET,
            unexpected_erp_column="surprise",  
        )


def test_negative_counts_are_rejected() -> None:
    with pytest.raises(ValidationError):
        ProductionLineRecord(
            line_id="L1",
            line_name="Line 1",
            product="Steel Frames",
            shift=Shift.MORNING,
            target_units=-5,
            produced_units=90,
            efficiency_pct=90.0,
            status=ProductionStatus.ON_TARGET,
        )


def test_tenant_mismatch_raises() -> None:
    with pytest.raises(ValueError, match="Tenant isolation violation"):
        assert_tenant_match("tenant-beta", "tenant-alpha")


def test_tenant_match_passes_silently() -> None:
    assert assert_tenant_match("tenant-alpha", "tenant-alpha") is None


def test_denied_domain_is_absent_not_empty() -> None:
    bundle = RonaContextBundle(
        tenant_id="tenant-alpha",
        user_role=UserRole.PRODUCTION_MANAGER,
        granted_domains=[DataDomain.PRODUCTION],
        denied_domains=[DataDomain.FINANCE, DataDomain.HR],
        period=_PERIOD,
        generated_at=datetime(2026, 8, 11, 9, 0, 0),
        production=_production_context(),
    )
    assert bundle.finance is None
    assert bundle.hr is None
    assert bundle.loaded_domains() == [DataDomain.PRODUCTION]
    assert not bundle.is_empty()


def test_empty_bundle_is_detected() -> None:
    bundle = RonaContextBundle(
        tenant_id="tenant-alpha",
        user_role=UserRole.SAAS_ADMIN,
        denied_domains=list(DataDomain),
        period=_PERIOD,
        generated_at=datetime(2026, 8, 11, 9, 0, 0),
    )
    assert bundle.is_empty()


def test_context_carries_its_own_tenant_for_defence_in_depth() -> None:
    context = _production_context(tenant_id="tenant-gamma")
    assert context.tenant_id == "tenant-gamma"
    assert context.source_system == "mock"
    with pytest.raises(ValueError):
        assert_tenant_match(context.tenant_id, "tenant-alpha")


def test_hr_context_answers_the_ai_txt_hr_questions() -> None:
    context = HRContext(
        tenant_id="tenant-alpha",
        domain=DataDomain.ATTENDANCE,
        period_label="11 Aug 2026",
        period_start=date(2026, 8, 11),
        period_end=date(2026, 8, 11),
        generated_at=datetime(2026, 8, 11, 9, 0, 0),
        total_headcount=194,
        present_count=182,
        absent_count=12,
        late_count=7,
        on_leave_count=0,
        attendance_rate_pct=93.8,
        absenteeism_rate_pct=6.2,
        total_overtime_hours=41.5,
        employees_on_overtime=9,
    )

    assert context.absent_count == 12
    assert context.absenteeism_rate_pct == pytest.approx(6.2)

    assert context.late_count == 7
    assert context.employees_on_overtime == 9
