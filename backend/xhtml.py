from models import MiniQuestionnaire
from b8_definition import B8_ITEM_MAP


def render_xhtml(questionnaire: MiniQuestionnaire) -> str:
    rows = []
    for answer in questionnaire.answers:
        item = B8_ITEM_MAP.get(answer.item_code)
        label = item.label if item else answer.item_code
        value = answer.value or "—"
        specify_cell = ""
        if item and item.allows_specify and answer.value == "YES":
            specify_cell = f"<td>{answer.specify or ''}</td>"
        else:
            specify_cell = "<td></td>"
        rows.append(
            f"<tr><td>{label}</td><td>{value}</td>{specify_cell}</tr>"
        )

    rows_html = "\n      ".join(rows)
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>VSME {questionnaire.questionnaire_code}</title></head>
  <body>
    <h1>Disclosure {questionnaire.questionnaire_code}</h1>
    <table border="1" cellpadding="4" cellspacing="0">
      <thead>
        <tr><th>Item</th><th>Value</th><th>Specify</th></tr>
      </thead>
      <tbody>
      {rows_html}
      </tbody>
    </table>
  </body>
</html>"""
