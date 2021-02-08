const defaultMethods = [
  {
    id: 6,
    code: "SFT",
  },
  {
    id: 12,
    code: "PPH",
  },
  {
    id: 11,
    code: "ADY",
  },
  {
    id: 20,
    code: "CYB",
  },
  {
    id: 1000,
    code: "OPT_CRD",
  },
  {
    id: 1001,
    code: "OPT_TRY",
  },
  {
    id: 1002,
    code: "OPT_SFT",
  },
];

const el = [...document.querySelectorAll("body > script")]
  .map((x) => x.textContent)
  .find((x) => x.includes("__INITIAL_STATE__"));

if (el) {
  const m = el.match(/__INITIAL_STATE__ *= *(.*);/) ?? [];
  let parsed = null;
  try {
    parsed = JSON.parse(m[1]).calculationDetails.calculation.paymentMethods;
  } catch (e) {
    console.warn("__INITIAL_STATE__ parse error", e);
  }

  const methods = parsed ?? defaultMethods;

  const elements = [...document.querySelectorAll("[name=payment-method]")];
  elements.forEach((el) => {
    const newel = document.createElement("div");
    const id = Number(el.id.replace("payment-method-", ""));
    const method = methods.find((x) => x.id === id);
    const text = method ? `${id} (${method.code})` : id;
    newel.innerText = text;
    el.parentNode.appendChild(newel);
    el.parentNode.position = "relative";
    newel.style.color = "green";
    newel.style.position = "absolute";
    newel.style.top = "0";
    newel.style.left = "5px";
    newel.style["font-weight"] = "bold";
  });
}
