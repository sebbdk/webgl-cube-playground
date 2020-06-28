// Render a plan based box + colors

import { mat4, vec3 } from "gl-matrix";

/** @type {WebGLRenderingContext} */
export function createCtx(elm) {
    /** @type {HTMLCanvasElement} */
    const canvas = document.createElement('canvas');
    canvas.setAttribute('width', '600px');
    canvas.setAttribute('height', '400px');
    elm.appendChild(canvas);

    const gl = canvas.getContext('webgl');
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    return gl;
}

// Fragment shader
const fsShader = `
    varying lowp vec4 vColor;

    void main(void) {
        //gl_FragColor = vec4(0.5, 0, 0.5, 1);
        gl_FragColor = vColor;
    }
`;

// vertex shader
const vsShader = `
    attribute vec3 position;

    uniform vec4 color;
    uniform mat4 transform;
    uniform mat4 cameraTransform;

    // Defined a color output to next shader
    varying lowp vec4 vColor;

    void main(void) {
        gl_Position = cameraTransform * transform * vec4(position, 1);
        vColor = color;
    }
`;

export function createShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    }

    return shader;
}

export function getVShader(gl, source) {
    return createShader(gl, source, gl.VERTEX_SHADER);
}

export function getTShader(gl, source) {
    return createShader(gl, source, gl.FRAGMENT_SHADER);
}

/** @type WebGLProgram */
export function initShaders(gl) {
    const shaderProgram = gl.createProgram();

    gl.attachShader(shaderProgram, getVShader(gl, vsShader));
    gl.attachShader(shaderProgram, getTShader(gl, fsShader));
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw('Could not initalize shaders!');
    }

    shaderProgram.positionLocation = gl.getAttribLocation(shaderProgram, "position");
    shaderProgram.transformLocation = gl.getUniformLocation(shaderProgram, "transform");
    shaderProgram.colorLocation = gl.getUniformLocation(shaderProgram, "color");
    shaderProgram.cameraTransformLocation = gl.getUniformLocation(shaderProgram, "cameraTransform");

    gl.enableVertexAttribArray(shaderProgram.positionLocation);

    return shaderProgram;
}

export function degToRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {Object} shaderProgram
 *
 * @returns void
 */
export function createPlane(gl, shaderProgram) {
    const color = [ 0.5, 0.0, 0.5, 1.0 ];
    let vertices = [
        // Back
        -1.0, 1.0, -1.0,
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        -1.0, 1.0, -1.0,

        // Front
        -1.0, 1.0, 1.0,
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // top
        -1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // bottom
        -1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,
        -1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        1.0, -1.0, -1.0,

        // right
        -1.0, -1.0, 1.0,
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, -1.0, -1.0,

        // bottom
        1.0, -1.0, 1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, 1.0,
        1.0, -1.0, -1.0,
    ];

    /** @type {WebGLBuffer} */
    const vertBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Position, rotation etc. Matrix
    let mvMatrix = mat4.create();
    let rotation = 0;
    return (pMatrix, delta) => {
        // Set shader to use
        gl.useProgram(shaderProgram);

        rotation = rotation + delta * 0.05;

        // Position our triangle
        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, mvMatrix, [0, 0, -5]);
        mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotation));
        //mat4.rotateZ(mvMatrix, mvMatrix, degToRad(rotation));
        //mat4.rotateX(mvMatrix, mvMatrix, degToRad(rotation));

        // Pass model view projection to shader
        gl.uniformMatrix4fv(shaderProgram.transformLocation, false, mvMatrix);
        gl.uniformMatrix4fv(shaderProgram.cameraTransformLocation, false, pMatrix);
        gl.uniform4fv(shaderProgram.colorLocation, new Float32Array(color));

        // Add vertex data and prep the variable type.
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
        gl.enableVertexAttribArray(shaderProgram.positionLocation);
        gl.vertexAttribPointer(shaderProgram.positionLocation, 3, gl.FLOAT, false, 0, 0);

        //draw it!
        gl.drawArrays(gl.TRIANGLES, 0, 33);
    };
}

export function create(elm) {
    // Configurables
    const fieldOfView = degToRad(60);

    // Setup webgl
    const gl = createCtx(elm);
    const shaderProgram = initShaders(gl);
    const renderPlane = createPlane(gl, shaderProgram);

    gl.clearColor(0.75, 0.85, 0.8, 1);
    gl.enable(gl.DEPTH_TEST);

    // Prepare perspective matrix
    const pMatrix = mat4.create();

    mat4.perspective(pMatrix, fieldOfView, gl.viewportWidth / gl.viewportHeight, 0.1, 50.0);
    //mat4.translate (pMatrix, pMatrix, [0, 0, -3]); // Use this to move camera around
    //mat4.rotateY(pMatrix, pMatrix, degToRad(30)); // Turn camera


    return () => {
        const fps = 10;
        let last = performance.now();

        function render() {
            const delta = performance.now()-last;
            const deltaTime = delta / (1000 / fps);

            last = performance.now();

            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            renderPlane(pMatrix, delta);

            window.requestAnimationFrame(() => {
                // drop frames if called too often
                //render();
            });

            setTimeout(() => {
                render();
            }, 30);
        }

        render();
    }
}

export function gl(elm) {
    const run = create(elm);
    run();
}
