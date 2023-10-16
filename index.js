function setPropertyRequired(attributeName, boolValue = true) {
  //обов"язкове
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.required = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

function setPropertyHidden(attributeName, boolValue = true) {
  //приховане
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.hidden = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

function setPropertyDisabled(attributeName, boolValue = true) {
  //недоступне
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.disabled = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

function setAttrValue(attributeCode, attributeValue) {
  var attribute = EdocsApi.getAttributeValue(attributeCode);
  attribute.value = attributeValue;
  EdocsApi.setAttributeValue(attribute);
}

//Скрипт 1. Автоматичне визначення email ініціатора рахунку та підрозділу
function onCreate() {
  EdocsApi.setAttributeValue({
    code: "OrgRPEmail",
    value: EdocsApi.getEmployeeDataByEmployeeID(CurrentDocument.initiatorId)
      .email,
    text: null,
  });
  EdocsApi.setAttributeValue({
    code: "Branch",
    value: EdocsApi.getOrgUnitDataByUnitID(
      EdocsApi.getEmployeeDataByEmployeeID(CurrentDocument.initiatorId).unitId,
      1
    ).unitId,
    text: null,
  });
}

function onSearchBranch(searchRequest) {
  searchRequest.filterCollection.push({
    attributeCode: "SubdivisionLevelDirect",
    value: "1",
  });
}

//Скрипт 2. Вирахування ПДВ
function onChangeContract() {
  var VATpercentage = 0;
  var attrVATAmount = EdocsApi.getAttributeValue("ContractVATAmount");
  var attrVATpercentage = EdocsApi.getAttributeValue("ContractVATPercent");
  var attrContractAmount = EdocsApi.getAttributeValue("ContractAmount");
  var attrAmountOutVAT = EdocsApi.getAttributeValue("ContractOutVAT");

  switch (attrVATpercentage.value) {
    case "20%": // if (x === 'если сумма НДС=20%')
      var VATpercentage = 1.2;
      break;

    case "7%": // if (x === 'если сумма НДС=7%')
      var VATpercentage = 1.07;
      break;
  }

  if (attrVATpercentage.value === null || attrContractAmount.value === null) {
    // если нет ставки НДС и суммы, то укажем ноль в сумме НДС и без НДС
    attrVATAmount.value = 0;
    attrAmountOutVAT.value = 0;
  } else if (VATpercentage == 0) {
    attrVATAmount.value = 0;
    attrAmountOutVAT.value = attrContractAmount.value;
  } else {
    attrAmountOutVAT.value = (attrContractAmount.value / VATpercentage).toFixed(
      2
    );
    attrVATAmount.value = (
      attrContractAmount.value - attrAmountOutVAT.value
    ).toFixed(2);
  }

  EdocsApi.setAttributeValue(attrVATAmount);
  EdocsApi.setAttributeValue(attrAmountOutVAT);
}

function onChangeVATpercentage() {
  onChangeContract();
}

//Скрипт 3. Заповнення значення поля суми договору прописом
function onChangeContractAmount() {
  setAmountDescription();
}

function setAmountDescription() {
  debugger;
  var ContractAmount = EdocsApi.getAttributeValue("ContractAmount").value;

  if (ContractAmount) {
    setValueAttr(
      "VATAmmountDescription",
      EdocsApi.numberToCurrency(ContractAmount, "uk", "UAH")
    );
  } else {
    setValueAttr("VATAmmountDescription", "");
  }
}

//Скрипт 4. Заповнення інформації про додаткового підписанта
function setAdditionalSignatory() {
  debugger;

  var data = EdocsApi.getContractorData(
    EdocsApi.getAttributeValue("OrganizationId").value
  );
  if (EdocsApi.getAttributeValue("OrgAgentSurname2").value && data) {
    setValueAttr(
      "OrgAgent2",
      data.authorisedPersons.find(
        (x) =>
          x.fullName.replace(",", ".") ==
          EdocsApi.getAttributeValue("OrgAgentSurname2").text
      ).nameGenitive
    );
    setValueAttr(
      "OrgAgentPosition2",
      data.authorisedPersons.find(
        (x) => x.fullName == EdocsApi.getAttributeValue("OrgAgentSurname2").text
      ).positionGenitive
    );
    setValueAttr(
      "PositionOrgAgent2",
      data.authorisedPersons.find(
        (x) => x.fullName == EdocsApi.getAttributeValue("OrgAgentSurname2").text
      ).position
    );
    setValueAttr(
      "ActsOnBasisOrg2",
      data.authorisedPersons.find(
        (x) => x.fullName == EdocsApi.getAttributeValue("OrgAgentSurname2").text
      ).actingUnderThe
    );
  } else {
    setValueAttr("OrgAgent2", "");
    setValueAttr("OrgAgentPosition2", "");
    setValueAttr("PositionOrgAgent2", "");
    setValueAttr("ActsOnBasisOrg2", "");
    EdocsApi.message("Внесіть коректного підписанта");
  }
}

function onChangeOrgAgentSurname1() {
  debugger;
  var attrOrgAgentSurname1 = EdocsApi.getAttributeValue("OrgAgentSurname1");
  if (attrOrgAgentSurname1.text)
    setAttrValue(
      "InitialAgent1",
      formattingOfInitials(attrOrgAgentSurname1.text)
    );
  if (attrOrgAgentSurname1.value)
    setAttrValue(
      "InitialAgent1",
      formattingOfInitials(attrOrgAgentSurname1.value)
    );
}

function onChangeOrgAgentSurname2() {
  setAdditionalSignatory();
  var attrOrgAgentSurname2 =
    EdocsApi.getAttributeValue("OrgAgentSurname2").text;
  if (attrOrgAgentSurname2)
    setAttrValue("InitialAgent2", formattingOfInitials(attrOrgAgentSurname2));
}

function formattingOfInitials(fullName) {
  debugger;
  var arr = fullName.split(" ");
  var arrNew = [];
  arr[1] &&
    arrNew.push(
      arr[1]?.slice(0, 1).toUpperCase() + arr[1]?.slice(1).toLowerCase()
    );
  arrNew.push(arr[0].toUpperCase());
  return arrNew.join(" ");
}

// Скрипт 6. Визначення ролі за розрізом
function setSections() {
  debugger;
  var Branch = EdocsApi.getAttributeValue("Branch");
  if (Branch.value) {
    var Sections = EdocsApi.getAttributeValue("Sections");
    var BranchData = EdocsApi.getOrgUnitDataByUnitID(Branch.value);
    if (Sections.value != BranchData.unitName) {
      Sections.value = BranchData.unitName;
      EdocsApi.setAttributeValue(Sections);
    }
  }
}

function onChangeBranch() {
  setSections();
}
