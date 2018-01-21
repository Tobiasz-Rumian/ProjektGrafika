var gl_canvas;
var gl_ctx;

var _triangleVertexBuffer;
var _triangleFacesBuffer;
var _position;
var _uv;
var _color;
var _sampler;
var _PosMatrix;
var _MovMatrix;
var _ViewMatrix;
var _matrixProjection;
var _matrixMovement;
var _matrixView;
var _cubeTexture;
var animateWorking = false;
var rotationSpeed = 0.001;
var zoomRatio = -6;
var triangleVertices=[];
var X, Y, Z;
var img1, img2, img3;
var DEPTH = 2;
var PERTURBATION_RATIO = 0.5;
var INITIAL_SIZE = 0.150;
var INITIAL_CORD = 0;
var BACKGROUND_COLOR = [0.5, 1.0, 0.83];
var triangleFaces=[];
var needToClear = true;
var bufsize=0;
function runWebGL () {
    getRotation();
    getImage();
    rotationSpeed = 0.001;

    gl_canvas = document.getElementById("glcanvas");
    gl_ctx = gl_getContext(gl_canvas);
    gl_initShaders();
    gl_initBuffers();
    gl_setMatrix();
    _cubeTexture = gl_initTexture();
    gl_draw();
}

function getRotation() {
    X = document.getElementById('rotateX').checked;
    Y = document.getElementById('rotateY').checked;
    Z = document.getElementById('rotateZ').checked;
}

function getImage() {
    img1 = document.getElementById('img1').checked;
    img2 = document.getElementById('img2').checked;
    img3 = document.getElementById('img3').checked;
}

function gl_getContext (canvas) {
    try {
        var ctx = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        ctx.viewportWidth = canvas.width;
        ctx.viewportHeight = canvas.height;
    } catch (e) {}

    if (!ctx) {
        document.write('Unable to initialize WebGL. Your browser may not support it.')
    }
    return ctx;
}
function gl_initShaders () {
    var vertexShader = "\n\
      attribute vec2 position;\n\
      attribute vec3 color;\n\
      varying vec3 vColor;\n\
      void main(void) {\n\
         gl_Position = vec4(position, 0., 1.);\n\
         vColor = color;\n\
      }";

    var fragmentShader = "\n\
      precision mediump float;\n\
      varying vec3 vColor;\n\
      void main(void) {\n\
         gl_FragColor = vec4(vColor, 1.);\n\
      }";

    var getShader = function(source, type, typeString) {
        var shader = gl_ctx.createShader(type);
        gl_ctx.shaderSource(shader, source);
        gl_ctx.compileShader(shader);

        if (!gl_ctx.getShaderParameter(shader, gl_ctx.COMPILE_STATUS)) {
            alert('error in ' + typeString);
            return false;
        }
        return shader;
    };

    var shaderVertex = getShader(vertexShader, gl_ctx.VERTEX_SHADER, "VERTEX");
    var shaderFragment = getShader(fragmentShader, gl_ctx.FRAGMENT_SHADER, "FRAGMENT");

    var shaderProgram = gl_ctx.createProgram();
    gl_ctx.attachShader(shaderProgram, shaderVertex);
    gl_ctx.attachShader(shaderProgram, shaderFragment);

    gl_ctx.linkProgram(shaderProgram);

    _position = gl_ctx.getAttribLocation(shaderProgram, "position");
    _color = gl_ctx.getAttribLocation(shaderProgram, "color");

    gl_ctx.enableVertexAttribArray(_position);
    gl_ctx.enableVertexAttribArray(_color);

    gl_ctx.useProgram(shaderProgram);
}

function addVertexWithColor(x,y) {
     triangleVertices.push(x,y,Math.random(),Math.random(),Math.random());
}
function getRandomFloat(min,max) {
   var v= (Math.random() * (max - 0) + 0).toFixed(10)
   return v
}
function drawSquere(x,y,side) {
    lght = triangleVertices.length;
        addVertexWithColor(
            (x + getRandomFloat(-PERTURBATION_RATIO, PERTURBATION_RATIO)) / 100,
            (y + getRandomFloat(-PERTURBATION_RATIO, PERTURBATION_RATIO)) / 100);
        addVertexWithColor(
            (x + getRandomFloat(-PERTURBATION_RATIO, PERTURBATION_RATIO)) / 100,
            (y + side + getRandomFloat(-PERTURBATION_RATIO, PERTURBATION_RATIO)) / 100);
        addVertexWithColor(
            (x + side + getRandomFloat(-PERTURBATION_RATIO, PERTURBATION_RATIO)) / 100,
            (y + side + getRandomFloat(-PERTURBATION_RATIO, PERTURBATION_RATIO)) / 100);
        addVertexWithColor(
            (x + side + getRandomFloat(-PERTURBATION_RATIO, PERTURBATION_RATIO)) / 100,
            (y + getRandomFloat(-PERTURBATION_RATIO, PERTURBATION_RATIO)) / 100);
    triangleFaces.push(lght+1,lght+2,lght+3,lght+4);
    bufsize+=4;
}
function emptyPolygon(x,y,side) {
    triangleVertices.push((x + side) / 100, (y + side) / 100,BACKGROUND_COLOR[0],BACKGROUND_COLOR[1],BACKGROUND_COLOR[2]);
    triangleVertices.push((x + side) / 100, (y + 0.02 * side) / 100,BACKGROUND_COLOR[0],BACKGROUND_COLOR[1],BACKGROUND_COLOR[2]);
    triangleVertices.push((x + 0.02 * side) / 100, (y + 0.02 * side) / 100,BACKGROUND_COLOR[0],BACKGROUND_COLOR[1],BACKGROUND_COLOR[2]);
    triangleVertices.push((x + 0.02 * side) / 100, (y + side) / 100,BACKGROUND_COLOR[0],BACKGROUND_COLOR[1],BACKGROUND_COLOR[2]);
}
function drawInitialPolygon(x,y,side) {
    drawSquere(x, y, side);
}
function handlePolygon(x,y,side,depth) {
        side /= 3;
        emptyPolygon(x, y, side);
        drawSquere(x, y, side);
        drawSquere(x, y + side, side);
        drawSquere(x, y + 0.02 * side, side);
        drawSquere(x + side, y + 0.02 * side, side);
        drawSquere(x + 0.02 * side, y + 0.02 * side, side);
        drawSquere(x + 0.02 * side, y + side, side);
        drawSquere(x + 0.02 * side, y, side);
        drawSquere(x + side, y, side);
        depth += 1;
        if (depth <= DEPTH) {
            if (needToClear && depth == DEPTH) {
                needToClear = false;
                gl_ctx.clear(gl_ctx.COLOR_BUFFER_BIT | gl_ctx.DEPTH_BUFFER_BIT);
            }
            handlePolygon(x, y, side, depth);
            handlePolygon(x, y + side, side, depth);
            handlePolygon(x, y + 0.02 * side, side, depth);
            handlePolygon(x + side, y + 0.02 * side, side, depth);
            handlePolygon(x + 0.02 * side, y + 0.02 * side, side, depth);
            handlePolygon(x + 0.02 * side, y + side, side, depth);
            handlePolygon(x + 0.02 * side, y, side, depth);
            handlePolygon(x + side, y, side, depth);
        }
}

function gl_initBuffers () {
    _triangleVertexBuffer = gl_ctx.createBuffer();
    gl_ctx.bindBuffer(gl_ctx.ARRAY_BUFFER, _triangleVertexBuffer);
    gl_ctx.bufferData(gl_ctx.ARRAY_BUFFER, new Float32Array(triangleVertices), gl_ctx.STATIC_DRAW);
    _triangleFacesBuffer = gl_ctx.createBuffer();
    gl_ctx.bindBuffer(gl_ctx.ELEMENT_ARRAY_BUFFER, _triangleFacesBuffer);
    gl_ctx.bufferData(gl_ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangleFaces), gl_ctx.STATIC_DRAW);
}

function gl_setMatrix () {
    _matrixProjection = MATRIX.getProjection(40, gl_canvas.width/gl_canvas.height, 1, 100);
    _matrixMovement = MATRIX.getIdentityMatrix();
    _matrixView = MATRIX.getIdentityMatrix();

    MATRIX.translateZ(_matrixView, zoomRatio);
}

function gl_initTexture() {
    var img = new Image();
    img.src = 'cubeTexture.png';
    if(img1) img.src = 'cubeTexture.png';
    else if(img2) img.src = 'cubeTexture2.png';
    else if(img3) img.src = 'cubeTexture3.png';
    img.webglTexture = false;
    img.onload = function() {
        var texture = gl_ctx.createTexture();

        gl_ctx.pixelStorei(gl_ctx.UNPACK_FLIP_Y_WEBGL, true);
        gl_ctx.bindTexture(gl_ctx.TEXTURE_2D, texture);
        gl_ctx.texParameteri(gl_ctx.TEXTURE_2D, gl_ctx.TEXTURE_MIN_FILTER, gl_ctx.LINEAR);
        gl_ctx.texParameteri(gl_ctx.TEXTURE_2D, gl_ctx.TEXTURE_MAG_FILTER, gl_ctx.LINEAR);

        gl_ctx.texImage2D(gl_ctx.TEXTURE_2D, 0, gl_ctx.RGBA, gl_ctx.RGBA, gl_ctx.UNSIGNED_BYTE, img);

        gl_ctx.bindTexture(gl_ctx.TEXTURE_2D, null);
        img.webglTexture = texture;
    };
    return img;
}

function gl_draw() {
    gl_ctx.clearColor(BACKGROUND_COLOR[0],BACKGROUND_COLOR[1],BACKGROUND_COLOR[2], 1.0);

    var animate = function () {
        drawInitialPolygon(INITIAL_CORD, INITIAL_CORD, INITIAL_SIZE);
        handlePolygon(INITIAL_CORD, INITIAL_CORD, INITIAL_SIZE, 0);
        gl_ctx.viewport(0.0, 0.0, gl_canvas.width, gl_canvas.height);
        gl_ctx.clear(gl_ctx.COLOR_BUFFER_BIT);

        gl_ctx.vertexAttribPointer(_position, 2, gl_ctx.FLOAT, false, 4*(2+3), 0);
        gl_ctx.vertexAttribPointer(_color, 3, gl_ctx.FLOAT, false, 4*(2+3), 2*4);

        gl_ctx.bindBuffer(gl_ctx.ARRAY_BUFFER, _triangleVertexBuffer);
        gl_ctx.bindBuffer(gl_ctx.ELEMENT_ARRAY_BUFFER, _triangleFacesBuffer);

        gl_ctx.drawElements(gl_ctx.TRIANGLES, bufsize, gl_ctx.UNSIGNED_SHORT, 0);
        gl_ctx.flush();
    };
    animate();
}