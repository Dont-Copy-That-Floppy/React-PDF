/* eslint-disable no-unused-vars */
import React from "react";
import GridContainer from "Components/Grid/GridContainer.js";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import GridItem from "Components/Grid/GridItem";
import { ButtonGroup, Button } from "@mui/material";
import PropTypes from "prop-types";
import Signature from "CustomComponents/Signature.js";
import { PDFDocument } from "pdf-lib";
import { savePDF, sendEmail, getFile, addJob, addSale, updateCustomerFiles } from "api.js";
import {
  sha256,
  validateEmail,
  unit8_to_base64,
} from "functions/dataFormat.js";
import { Buffer } from "buffer";
import { ControlPointSharp } from "@material-ui/icons";

export default function PDF(props) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
  const { customerID, customerInput, tag, setClose } = props;
  const [fileBytes, setFileBytes] = React.useState(null);
  const [totalPages, setTotalPages] = React.useState(1);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [file, setFile] = React.useState({});
  const canvasRef = React.useRef(null);
  const documentRef = React.useRef(null);
  const pageRef = React.useRef(null);
  const [includesJob, setIncludesJob] = React.useState(false);
  const [includesSale, setIncludesSale] = React.useState(false);
  const [openSignatureDialog, setSignatureOpen] = React.useState(false);
  const [textFields, setTextFields] = React.useState({});
  const [customer, setCustomer] = React.useState(customerInput);
  const [permaForm, setPermaForm] = React.useState({});
  var pdfForm = {};

  //****************************************************************************/
  // Load Init
  //****************************************************************************/
  React.useEffect(() => {
    window.addEventListener("popstate", onBackButtonEvent);
  }, []);

  React.useEffect(() => {
    if (tag != "") {
      getFile({
        searchParams: {
          tag: tag, // given in props
          type: "application/pdf;",
        },
        doAfter: function (data) {
          setFile(data);
          const byteArray = Buffer.from(data.bytes, "base64");
          setInitFields(byteArray);
          setPageNumber(1);
        },
      });
    }
  }, [tag]);
  //****************************************************************************/
  // Format Init
  //****************************************************************************/
  // loads in values from customer record to pdf
  async function setInitFields(byteArray) {
    //console.log("Async function");
    const pdfDoc = await PDFDocument.load(byteArray);
    const form = pdfDoc.getForm();
    const thisDate = new Date();
    // set fields on pdf that correspond with customer object from db
    form.getFields().forEach((field) => {
      let fName = field.getName();
      let fName_lower = fName.toLowerCase();
      if (fName.includes("Customer") && fName.includes(";")) {
        let subfields = fName.split(";");
        let fValue = "";
        for (let i = 0; i < subfields.length - 1; i++) {
          let jsonFieldName = parseJSONStr(subfields[i]);
          fValue += pdfFieldMerge(jsonFieldName["Customer"], customer);
          if (subfields.length > 1 && i < subfields.length - 2) {
            fValue += ", ";
          }
        }
        setTextField(form, fName, fValue);
      } else if (!includesJob && fName.includes("Job")) {
        setIncludesJob(true);
      } else if (!includesSale && fName.includes("Sale")) {
        setIncludesSale(true);
      } else if (fName_lower == "date") {
        setTextField(form, "Date", thisDate.toLocaleDateString("en-US"));
      } else if (fName_lower == "day") {
        //console.log(thisDate.getDate());
        setTextField(form, "Day", thisDate.getDate().toString());
      } else if (fName_lower == "month") {
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        setTextField(form, "Month", monthNames[thisDate.getMonth()]);
      } else if (fName_lower == "year") {
        setTextField(form, "Year", thisDate.getFullYear().toString());
      }
      //console.log(textFields);
    });

    pdfDoc.save().then((newBytes) => {
      setFileBytes(newBytes);
    });
  }

  function parseJSONStr(fieldStr) {
    try {
      return JSON.parse(JSON.parse(JSON.stringify(fieldStr)));
    } catch {
      console.log("Parse failed");
      console.log(fieldStr);
    }
  }

  // recursively align two different objects
  function pdfFieldMerge(object1, object2) {
    try {
      let result = "";
      for (let [key, value] of Object.entries(object1)) {
        if (typeof value === "object" && object2[key] != undefined) {
          //console.log(object2[key]);
          result = pdfFieldMerge(object1[key], object2[key]);
        } else {
          result = object2[key] || "";
        }
      }
      return result;
    } catch {
      console.log("pdfFieldMerge failed");
      console.log(object1);
    }
  }
  //***************************************************************************/
  // PDF Handlers
  //****************************************************************************/
  const onDocumentLoadSuccess = ({ numPages }) => {
    pdfForm = permaForm;
    setTotalPages(numPages);
  };

  const previousPage = () => {
    saveState();
    setPageNumber((prevPageNumber) => prevPageNumber - 1);
  };

  const nextPage = () => {
    saveState();
    setPageNumber((prevPageNumber) => prevPageNumber + 1);
  };

  const onBackButtonEvent = (e) => {
    e.preventDefault();
    //var currentLocation = window.location.pathname;
    //history.push(`${currentLocation}/mypage/new`);
    setClose();
  };

  //****************************************************************************/
  // Input Handlers
  //****************************************************************************/
  // inputs (pdfDoc.getForm, pdf text fieldName, value is text input
  function setTextField(form, fieldName, value) {
    //console.log(fieldName);
    //console.log(value);
    try {
      form.getTextField(fieldName).setText(value);
    } catch {
      console.log("Set Field failed: " + fieldName);
    }
  }

  // ran during any type of input with the pdf, click or type
  function setVariable(event) {
    //console.log(event.target.name);
    //console.log(event.target.value);
    if (event.type == "click" && event.target.name != undefined) {
      if (event.target.name.toLowerCase().includes("signature", 0)) {
        textFields[event.target.name] = "waiting for data";
        setSignatureData(null);
      }
    } else if (event.type == "input") {
      // ; symbol signifies a function, otherwise it's straight input
      // Get function uses an @ symbol
      if (event.target.name.includes(";")) {
        let temp = get_set_mojo(event);
        pdfForm = mergeMFObject(pdfForm, temp);
        //console.log(pdfForm);
      } else {
        pdfForm[event.target.name] = event.target.value;
      }
      textFields[event.target.name] = event.target.value;
    }
  }

  // biggest pain in the ass algo ever
  // go down each object depth and check if key/value exists
  // if value does exist at lowest, exchange
  // otherwise add new object
  function mergeMFObject(object1, object2) {
    var key = Object.keys(object2)[0];
    if (object1[key] == undefined) {
      object1 = { ...object1, ...object2 }; // confirmed
    } else {
      if (typeof object2[key] === "object") {
        let tempObj = mergeMFObject(object1[key], object2[key], "");
        object1[key] = tempObj;
      } else {
        object1[key] = object2[key]; // confirmed
      }
    }
    return object1;
  }

  // some sick shit, and a pretty damn good idea
  // By setting the field on the pdf to correspond with an actual date structure
  // and input can be directly assigned to corresponding objects, includes sub objects
  // within the pdf form
  function get_set_mojo(event) {
    let fields = event.target.name.split(";");
    let temp;
    for (let i = 0; i < fields.length; i++) {
      if (fields[i] != "") {
        try {
          temp = JSON.parse(fields[i].replace("[value]", event.target.value));
        } catch {
          console.log(fields[i] + " failed");
        }
      }
    }
    return temp;
  }

  // gets called when the input function for click on a 'signature' in name field exists
  const setSignatureData = async (data) => {
    const pdfDoc = await PDFDocument.load(fileBytes);
    const form = pdfDoc.getForm();
    setSignatureOpen(data == null);
    for (let [key, value] of Object.entries(textFields)) {
      if (textFields[key] == "waiting for data" && data != null) {
        textFields[key] = data;
        form.getTextField(key).setText("captured");
        break;
      }
    }
    pdfDoc.save().then((newBytes) => {
      setFileBytes(newBytes);
    });
  };

  //****************************************************************************/
  // Save all fields and store/send functions
  //****************************************************************************/
  const saveState = async () => {
    //console.log(pdfForm);
    const pdfDoc = await PDFDocument.load(fileBytes);
    const form = pdfDoc.getForm();
    setCustomer({ ...customer, ...pdfForm["Customer"] });
    setPermaForm(pdfForm);
    for (let [key, value] of Object.entries(textFields)) {
      if (key.toLowerCase().includes("signature")) {
        //console.log("run");
        const pngImage = await pdfDoc.embedPng(value);
        form.getTextField(key).setImage(pngImage);
      } else {
        setTextField(form, key, value);
      }
    }
    pdfDoc.save().then((newBytes) => {
      setFileBytes(newBytes);
    });
  };

  const addVariables2PDF = async (include_email) => {
    const pdfDoc = await PDFDocument.load(fileBytes);
    const form = pdfDoc.getForm();
    //************************************************ */
    //console.log(pdfForm);
    setCustomer({ ...customer, ...pdfForm["Customer"] });
    setPermaForm(pdfForm);
    for (let [key, value] of Object.entries(textFields)) {
      if (key.toLowerCase().includes("signature")) {
        //console.log("run");
        const pngImage = await pdfDoc.embedPng(value);
        form.getTextField(key).setImage(pngImage);
      } else {
        setTextField(form, key, value);
      }
    }
    //************************************************ */
    var customer_name = customer["First Name"] + " " + customer["Last Name"];
    var customer_email = customer.Email;
    var cell_number = customer["Cell Phone"];
    pdfForm = { ...pdfForm, ...textFields };
    //console.log(pdfForm);
    //console.log(textFields);
    var failed_required = false;
    var failed_fields = [];
    const fields = form.getFields();
    fields.forEach(async (field) => {
      const name = field.getName();
      if (
        form.getField(name).isRequired() &&
        (textFields[name] == "" || textFields[name] == undefined)
      ) {
        if (!failed_required) failed_required = true;
        failed_fields.push(name);
      } else if (name in pdfForm) {
        if (
          name.toLowerCase().includes("email") &&
          validateEmail(pdfForm[name])
        ) {
          customer_email = pdfForm[name];
        } else if (name.toLowerCase().includes("name")) {
          customer_name = pdfForm[name];
        } else if (name.toLowerCase().includes("cell")) {
          cell_number = pdfForm[name];
        }
      }
    });
    //************************************************** */
    if (!failed_required) {
      var trunced_filename = file.filename.split(".")[0];
      form.flatten();
      pdfDoc.setTitle(trunced_filename + customer_name);
      pdfDoc.setAuthor("");
      pdfDoc.setKeywords([tag, "", "", customer_name]);
      pdfDoc.setProducer("PDF App 9000 🤖");
      pdfDoc.setCreator("");
      pdfDoc.setCreationDate(new Date()); // new Date("2018-06-24T01:58:37.228Z")
      pdfDoc.setModificationDate(new Date());
      pdfDoc.save().then((newBytes) => {
        //console.log(unit8_to_base64(newBytes));
        pdfDoc.setSubject(sha256(unit8_to_base64(newBytes)));
        setFileBytes(newBytes);
        savePDF({
          customerID: customerID,
          newBytes: newBytes,
          pdfForm: pdfForm,
          tag: "Customer file " + tag,
          doAfter: function (data) {
            console.log(data);
          },
        });
        updateCustomerFiles({
          customerID: customerID,
          fileTag: tag,
          doAfter: function (data) {
            //console.log(data);
            if (customer.Files != undefined) {
              customer.Files[tag] = new Date().toISOString();
            } else {
              customer.Files = {};
              customer.Files[tag] = new Date().toISOString();
            }
          },
        });
        if (includesJob && pdfForm.Job != undefined) {
          //console.log(pdfForm);
          addJob({
            customerID: customerID,
            jobData: pdfForm.Job,
            doAfter: function (data) {
              //console.log(data);
              customer.Job = pdfForm.Job;
            },
          });
        }
        if (includesSale && pdfForm.Sale != undefined) {
          //console.log(pdfForm);
          addSale({
            customerID: customerID,
            customerName: customer["Full Name"],
            saleData: pdfForm.Sale,
            doAfter: function (data) {
              console.log(data);
              customer.Sale = pdfForm.Sale;
            },
          });
        }
        //console.log(customer_email);
        pdfDoc.saveAsBase64().then((newBytes64) => {
          //console.log(sha256(newBytes64));
          const files = [
            {
              filename: file.filename,
              data: newBytes64,
              contentType: "application/pdf",
              knownLength: 0,
            },
          ];
          if (include_email) {
            sendEmail({
              send_to: customer_email, // to
              send_cc: "", // cc
              send_bcc: "", // bcc
              subject: trunced_filename, // subject
              message:
                "Attached is your copy of " + trunced_filename + "", // message
              files: files,
            });
            console.log("Saved and Emailed Successfully");
            setClose();
          } else if (!validateEmail(customer_email)) {
            console.log(validateEmail(customer_email));
            console.log(customer_email);
            alert("Customer Email failure");
          } else {
            console.log("Saved Successfully");
            pdfForm = {};
            setPermaForm(pdfForm);
            setClose();
          }
        });
      });
    } else {
      alert("Fields failed: " + failed_fields.toString());
    }
  };

  //****************************************************************************/
  // React Display
  //****************************************************************************/
  return (
    <GridContainer>
      <GridItem xs={"auto"} sm={"auto"} md={"auto"}>
        <div>
          <Document
            file={{
              data: fileBytes,
            }}
            onLoadSuccess={onDocumentLoadSuccess}
            options={{
              cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
              cMapPacked: true,
            }}
            ref={documentRef}
          >
            <Page
              renderForms={true}
              renderAnnotationLayer={true}
              pageNumber={pageNumber}
              onClick={setVariable}
              onInput={setVariable}
              canvasRef={canvasRef}
              ref={pageRef}
            />
          </Document>
          <p>
            Page {pageNumber} of {totalPages}
          </p>
        </div>
        <Signature
          setCanvasData={setSignatureData}
          open={openSignatureDialog}
        />
      </GridItem>
      <GridItem>
        <ButtonGroup variant="outlined" aria-label="outlined button group">
          <Button disabled={pageNumber <= 1} onClick={previousPage}>
            Previous
          </Button>
          <Button disabled={pageNumber >= totalPages} onClick={nextPage}>
            Next
          </Button>
          <Button
            disabled={pageNumber < totalPages}
            onClick={() => addVariables2PDF(false)}
          >
            Save
          </Button>
          <Button
            disabled={pageNumber < totalPages}
            onClick={() => addVariables2PDF(true)}
          >
            Save &amp; Email
          </Button>
        </ButtonGroup>
      </GridItem>
    </GridContainer>
  );
}

PDF.propTypes = {
  customerID: PropTypes.string.isRequired,
  customerInput: PropTypes.object.isRequired,
  tag: PropTypes.string.isRequired,
  setClose: PropTypes.func.isRequired,
};
