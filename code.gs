// code.gs (For Google Apps Script)
// Note: Copy this code to your Google Apps Script project.

function doGet(e) {
  var action = e.parameter.action;
  
  if (action === "getSales") {
    // Existing getSales logic...
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sales");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Sheet not found"})).setMimeType(ContentService.MimeType.JSON);
    
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var sales = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var sale = {};
      for (var j = 0; j < headers.length; j++) {
        sale[headers[j]] = row[j];
      }
      sales.push(sale);
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: "success", data: sales})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "delete" || action === "deleteSale") {
    var invoice = e.parameter.invoice;
    if (!invoice) return ContentService.createTextOutput(JSON.stringify({success: false, message: "Missing invoice"})).setMimeType(ContentService.MimeType.JSON);
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sales");
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] == invoice) {
        sheet.deleteRow(i + 1);
        return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success: false, message: "Invoice not found"})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "updatePayment") {
    var invoice = e.parameter.invoice;
    var status = e.parameter.status;
    var paymentMethod = e.parameter.paymentMethod;
    
    if (!invoice || !status || !paymentMethod) {
       return ContentService.createTextOutput(JSON.stringify({success: false, message: "Missing parameters"})).setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sales");
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    
    var statusCol = headers.indexOf("status");
    var paymentCol = headers.indexOf("payment");
    
    if (statusCol === -1 || paymentCol === -1) {
      statusCol = headers.findIndex(h => h.toString().toLowerCase() === "status");
      paymentCol = headers.findIndex(h => h.toString().toLowerCase() === "payment");
    }
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] == invoice) { 
        if (statusCol !== -1) sheet.getRange(i + 1, statusCol + 1).setValue(status);
        if (paymentCol !== -1) sheet.getRange(i + 1, paymentCol + 1).setValue(paymentMethod);
        return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success: false, message: "Invoice not found"})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || e.parameter.action; 
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sales");
    
    if (action === "updateSale") {
      var invoice = data.invoice;
      var sheetData = sheet.getDataRange().getValues();
      var headers = sheetData[0];
      
      for (var i = 1; i < sheetData.length; i++) {
        if (sheetData[i][0] == invoice) { 
          var rowData = [];
          for (var j = 0; j < headers.length; j++) {
            var headerKey = headers[j]; 
            var val = data[headerKey];
            if (val === undefined && data[headerKey.toLowerCase()] !== undefined) {
              val = data[headerKey.toLowerCase()];
            }
            rowData.push(val !== undefined ? val : sheetData[i][j]);
          }
          sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
          return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({success: false, message: "Invoice not found"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Default saveSale logic
    var headers = sheet.getDataRange().getValues()[0];
    var rowData = [];
    for (var j = 0; j < headers.length; j++) {
      var headerKey = headers[j];
      var val = data[headerKey];
      if (val === undefined && data[headerKey.toLowerCase()] !== undefined) {
        val = data[headerKey.toLowerCase()];
      }
      rowData.push(val !== undefined ? val : "");
    }
    sheet.appendRow(rowData);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, message: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
