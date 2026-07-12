import { B8_ITEM_MAP } from "./b8Definition.js";

export function renderXhtml(questionnaire) {
  const rows = questionnaire.answers.map((answer) => {
    const item = B8_ITEM_MAP[answer.item_code];
    const label = item ? item.label : answer.item_code;
    const value = answer.value ?? "—";
    const specify = item?.allows_specify && answer.value === "YES" ? (answer.specify ?? "") : "";
    return `      <tr><td>${label}</td><td>${value}</td><td>${specify}</td></tr>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>VSME ${questionnaire.questionnaire_code}</title></head>
  <body>
    <h1>Disclosure ${questionnaire.questionnaire_code}</h1>
    <table border="1" cellpadding="4" cellspacing="0">
      <thead>
        <tr><th>Item</th><th>Value</th><th>Specify</th></tr>
      </thead>
      <tbody>
${rows.join("\n")}
      </tbody>
    </table>
  </body>
</html>`;
}
