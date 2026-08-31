"""Per-domain prompt section renderers.

Each module owns the prompt formatting for one data domain, so adding a
domain means adding a module here and registering it in the builder.
"""

from app.services.llm.prompt.sections.finance import finance_section
from app.services.llm.prompt.sections.hr import hr_section
from app.services.llm.prompt.sections.inventory import inventory_section
from app.services.llm.prompt.sections.maintenance import maintenance_section
from app.services.llm.prompt.sections.procurement import procurement_section
from app.services.llm.prompt.sections.production import production_section
from app.services.llm.prompt.sections.sales import sales_section

__all__ = [
    "finance_section",
    "hr_section",
    "inventory_section",
    "maintenance_section",
    "procurement_section",
    "production_section",
    "sales_section",
]
