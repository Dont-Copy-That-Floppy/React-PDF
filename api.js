/* eslint-disable no-unused-vars */
//import React from "react";
import PropTypes from "prop-types";
import getCookie from "functions/getCookie";
// eslint-disable-next-line no-unused-vars
import {
  convertSalesData,
  unit8_to_base64,
  sha256,
  mergeDateTime,
  iso2locale,
} from "functions/dataFormat.js";
import { Buffer } from "buffer";

export function getFile({ searchParams, doAfter }) {
  const request = new Request(
    process.env.REACT_APP_SERVICE + process.env.REACT_APP_API + "/api/getFile",
    {
      method: "POST",
      timeout: 10000,
      body: JSON.stringify({
        id: getCookie("id"),
        parameters: searchParams,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  fetch(request)
    .then((first_response) => first_response.json())
    .then((second_response) => {
      var data = second_response.data;
      doAfter(data);
    });
}

getFile.protoTypes = {
  searchParams: PropTypes.object.isRequired,
  doAfter: PropTypes.func.isRequired,
};

export function savePDF({ customerID, newBytes, pdfForm, tag, doAfter }) {
  const request = new Request(
    process.env.REACT_APP_SERVICE + process.env.REACT_APP_API + "/api/addFile",
    {
      method: "POST",
      timeout: 10000,
      body: JSON.stringify({
        added_by: getCookie("id"),
        customerID: customerID,
        bytes: Buffer.from(newBytes, "base64"),
        hash: sha256(unit8_to_base64(newBytes)),
        fields: pdfForm,
        type: "application/pdf;",
        encoding: "base64,",
        tag: tag,
        priviledge: "Guest",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  fetch(request)
    .then((first_response) => first_response.json())
    .then((second_response) => {
      var data = second_response.data;
      //console.log(data);
      doAfter(data);
    });
}

savePDF.propTypes = {
  customerID: PropTypes.string.isRequired,
  newBytes: PropTypes.object.isRequired,
  pdfForm: PropTypes.object.isRequired,
  tag: PropTypes.string.isRequired,
  doAfter: PropTypes.func.isRequired,
};

export function sendEmail({
  send_to,
  send_cc,
  send_bcc,
  subject,
  message,
  files,
}) {
  const request = new Request(
    process.env.REACT_APP_SERVICE +
      process.env.REACT_APP_API +
      "/api/sendEmail",
    {
      method: "POST",
      timeout: 10000,
      body: JSON.stringify({
        initiated_by: getCookie("id"),
        to: send_to, // can be array
        cc: send_cc, // can be array
        bcc: send_bcc, // can be array
        subject: subject,
        text: message,
        attachments: files, // can be array
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  fetch(request)
    .then((first_response) => first_response.json())
    .then((second_response) => {
      //console.log(second_response);
    });
}

sendEmail.protoTypes = {
  send_to: PropTypes.string.isRequired,
  send_cc: PropTypes.string,
  send_bcc: PropTypes.string,
  subject: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  files: PropTypes.object,
};

export function addJob({ customerID, jobData, doAfter }) {
  var today = new Date();
  jobData.added_by = getCookie("id");
  jobData.customerID = customerID;
  jobData.date_added = today.toISOString();
  jobData.current_status = "Pending";
  jobData.StatusChanges = {
    Pending: {
      date: today.toISOString(),
      changed_by: getCookie("id"),
    },
  };
  const request = new Request(
    process.env.REACT_APP_SERVICE + process.env.REACT_APP_API + "/api/addJob",
    {
      method: "POST",
      timeout: 10000,
      body: JSON.stringify({
        job: jobData,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  fetch(request)
    .then((first_response) => first_response.json())
    .then((second_response) => {
      var data = second_response.body;
      //console.log(data);
      doAfter(data);
    });
}

addJob.propTypes = {
  customerID: PropTypes.string.isRequired,
  jobData: PropTypes.object.isRequired,
  doAfter: PropTypes.func,
};

export function addSale({ customerID, saleData, doAfter }) {
  var today = new Date();
  saleData.added_by = getCookie("id");
  saleData.customerID = customerID;
  saleData.date_added = today.toISOString();
  const request = new Request(
    process.env.REACT_APP_SERVICE + process.env.REACT_APP_API + "/api/addSale",
    {
      method: "POST",
      timeout: 10000,
      body: JSON.stringify({
        sale: saleData,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  fetch(request)
    .then((first_response) => first_response.json())
    .then((second_response) => {
      var data = second_response.body;
      //console.log(data);
      doAfter(data);
    });
}

addSale.propTypes = {
  customerID: PropTypes.string.isRequired,
  saleData: PropTypes.object.isRequired,
  doAfter: PropTypes.func,
};

export function updateCustomerFiles({ customerID, fileTag, doAfter }) {
  const request = new Request(
    process.env.REACT_APP_SERVICE +
      process.env.REACT_APP_API +
      "/api/updateCustomerFiles",
    {
      method: "POST",
      timeout: 10000,
      body: JSON.stringify({
        customerID: customerID,
        fileTag: fileTag,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  fetch(request)
    .then((first_response) => first_response.json())
    .then((second_response) => {
      var data = second_response.response;
      //console.log(data);
      doAfter(data);
    });
}

updateCustomerFiles.propTypes = {
  customerID: PropTypes.string.isRequired,
  fileTag: PropTypes.string.isRequired,
  doAfter: PropTypes.func.isRequired,
};
