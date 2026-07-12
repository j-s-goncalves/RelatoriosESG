from dataclasses import dataclass


@dataclass(frozen=True)
class B8Item:
    item_code: str
    label: str
    allows_specify: bool


B8_ITEMS: list[B8Item] = [
    B8Item("code_of_conduct", "Does the undertaking have a code of conduct or human rights policy for its own workforce?", False),
    B8Item("covers_child_labour", "Does this cover child labour?", False),
    B8Item("covers_forced_labour", "Does this cover forced labour?", False),
    B8Item("covers_human_trafficking", "Does this cover human trafficking?", False),
    B8Item("covers_discrimination", "Does this cover discrimination?", False),
    B8Item("covers_accident_prevention", "Does this cover accident prevention?", False),
    B8Item("covers_other", "Does this cover other?", True),
    B8Item("complaints_mechanism", "Does the undertaking have a complaints-handling mechanism for its own workforce?", False),
]

B8_ITEM_MAP: dict[str, B8Item] = {item.item_code: item for item in B8_ITEMS}
