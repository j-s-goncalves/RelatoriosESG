export const B8_ITEMS = [
  { item_code: "code_of_conduct", label: "Does the undertaking have a code of conduct or human rights policy for its own workforce?", allows_specify: false },
  { item_code: "covers_child_labour", label: "Does this cover child labour?", allows_specify: false },
  { item_code: "covers_forced_labour", label: "Does this cover forced labour?", allows_specify: false },
  { item_code: "covers_human_trafficking", label: "Does this cover human trafficking?", allows_specify: false },
  { item_code: "covers_discrimination", label: "Does this cover discrimination?", allows_specify: false },
  { item_code: "covers_accident_prevention", label: "Does this cover accident prevention?", allows_specify: false },
  { item_code: "covers_other", label: "Does this cover other?", allows_specify: true },
  { item_code: "complaints_mechanism", label: "Does the undertaking have a complaints-handling mechanism for its own workforce?", allows_specify: false },
];

export const B8_ITEM_MAP = Object.fromEntries(B8_ITEMS.map((item) => [item.item_code, item]));

export function emptyB8() {
  return {
    questionnaire_code: "B8",
    answers: B8_ITEMS.map((item) => ({ item_code: item.item_code, value: null, specify: null })),
  };
}
