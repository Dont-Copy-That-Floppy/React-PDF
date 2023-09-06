import React from "react";
import GridContainer from "Components/Grid/GridContainer.js";
import GridItem from "Components/Grid/GridItem";
import { ButtonGroup, Button } from "@mui/material";
import Card from "Components/Card/Card.js";
import CardBody from "Components/Card/CardBody.js";
import CardHeader from "Components/Card/CardHeader.js";
import CardFooter from "Components/Card/CardFooter.js";
import { makeStyles } from "@material-ui/core/styles";
import styles from "assets/jss/material-dashboard-react/views/dashboardStyle.js";
import CanvasDraw from "react-canvas-draw";
import PropTypes from "prop-types";
import { Dialog, DialogTitle } from "@mui/material";
import { getFile } from "api.js";

const useStyles = makeStyles(styles);

export default function Signature(props) {
  const { setCanvasData, open } = props;
  const classes = useStyles();
  const [brushColor, setBrushColor] = React.useState("#444444");
  const [imageHeight, setImageHeight] = React.useState(200);
  const [imageWidth, setImageWidth] = React.useState(200);
  const [imageSource, setImageSource] = React.useState("");
  //const [file, setFile] = React.useState({});
  var canvasRef = React.useRef(null);

  function clearCanvas() {
    canvasRef.clear();
  }

  function changeColor(color) {
    defaultProps.brushColor = color;
    setProp(defaultProps);
    setBrushColor(color);
    //console.log(setCanvasData);
  }

  var [defaultProps, setProp] = React.useState({
    loadTimeOffset: 2,
    lazyRadius: 30,
    brushRadius: 3,
    catenaryColor: "#0a0302",
    gridColor: "rgba(150,150,150,0.17)",
    hideGrid: false,
    immediateLoading: true,
    hideInterface: false,
    gridSizeX: 25,
    gridSizeY: 25,
    gridLineWidth: 0.5,
    hideGridX: false,
    hideGridY: false,
    enablePanAndZoom: false,
    mouseZoomFactor: 0.01,
    zoomExtents: { min: 0.33, max: 3 },
  });

  React.useEffect(() => {
    getFile({
      searchParams: {
        tag: "signature background",
        type: "image/png;",
      },
      doAfter: function (data) {
        //setFile(data);
        var img = new Image();
        img.onload = function () {
          setImageHeight(this.height);
          setImageWidth(this.width);
          //console.log(this.width + "x" + this.height);
        };
        img.src = "data:" + data.type + data.encoding + data.bytes;
        setImageSource("data:" + data.type + data.encoding + data.bytes);
      },
    });
  }, []);

  //   function canvasChangeEvent(event) {
  //     console.log(event);
  //   }

  function saveCanvas() {
    // console.log(canvasRef.getSaveData()); svg points
    setCanvasData(canvasRef.getDataURL("png", true, null));
  }

  const handleClose = () => {};

  return (
    <Dialog onClose={handleClose} open={open} maxWidth={"md"} fullWidth={true}>
      <DialogTitle>Add Contract</DialogTitle>
      <Card>
        <CardHeader color="success">
          <h4 className={classes.cardTitleWhite}>Your Signature</h4>
        </CardHeader>
        <CardBody>
          <GridContainer>
            <GridItem xs={"auto"} sm={"auto"} md={"auto"}>
              <CanvasDraw
                ref={(canvasDraw) => (canvasRef = canvasDraw)}
                //onChange={canvasChangeEvent}
                //saveData={canvasData}
                brushColor={brushColor}
                canvasWidth={imageWidth}
                canvasHeight={imageHeight}
                imgSrc={imageSource}
                {...defaultProps}
              />
            </GridItem>
          </GridContainer>
        </CardBody>
        <CardFooter>
          <ButtonGroup>
            <Button onClick={clearCanvas}>Clear</Button>
            <Button onClick={saveCanvas}>Save</Button>
          </ButtonGroup>
          <ButtonGroup style={{ display: "none" }}>
            <Button onClick={() => changeColor("#ffff00")}>
              Set color to Yellow
            </Button>
            <Button onClick={() => changeColor("#800909")}>
              Set color to Red
            </Button>
          </ButtonGroup>
        </CardFooter>
      </Card>
    </Dialog>
  );
}

Signature.propTypes = {
  setCanvasData: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};
