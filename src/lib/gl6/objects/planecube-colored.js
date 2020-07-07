import { mat4 } from 'gl-matrix';
import { degToRad } from '../misc';
import { getVShader, getTShader } from '../shader';

// Fragment shader
export const fsShader = `
    varying lowp vec3 vColor;

    void main(void) {
        gl_FragColor = vec4(vColor, 1);
    }
`;

// vertex shader
export const vsShader = `
    attribute vec3 position;
    attribute vec3 aVertexColor;

    uniform vec4 color;
    uniform mat4 transform;
    uniform mat4 cameraTransform;

    // Defined a color output to next shader
    varying lowp vec3 vColor;

    void main(void) {
        gl_Position = cameraTransform * transform * vec4(position, 1);
        vColor = aVertexColor;
    }
`;

/**
 * Initshaders
 *
 * @param {WebGLProgram} gl
 *
 * return any
 */
export function initShaders(gl) {
    const shaderProgram = gl.createProgram();

    gl.attachShader(shaderProgram, getVShader(gl, vsShader));
    gl.attachShader(shaderProgram, getTShader(gl, fsShader));
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw('Could not initalize shaders!');
    }

    shaderProgram.positionLocation = gl.getAttribLocation(shaderProgram, "position");
    shaderProgram.aColorLocation = gl.getAttribLocation(shaderProgram, "aVertexColor");;

    shaderProgram.transformLocation = gl.getUniformLocation(shaderProgram, "transform");
    shaderProgram.colorLocation = gl.getUniformLocation(shaderProgram, "color");
    shaderProgram.cameraTransformLocation = gl.getUniformLocation(shaderProgram, "cameraTransform");

    gl.enableVertexAttribArray(shaderProgram.positionLocation);
    gl.enableVertexAttribArray(shaderProgram.aColorLocation);

    return shaderProgram;
}

export function createVertices() {
    const backColor = [0.1, 0.1, 0.5];
    const frontColor = [0.9, 0.5, 0.5];
    const topColor = [0.1, 0.3, 0.3];
    const bottomColor = [0.3, 0.8, 0.3];
    const rightColor = [0.8, 0.3, 0.3];
    const leftColor = [0.3, 0.3, 0.8];

    return [
        // Back
        -1.0, 1.0, -1.0,    ...backColor,
        -1.0, -1.0, -1.0,   ...backColor,
        1.0, -1.0, -1.0,    ...backColor,
        1.0, -1.0, -1.0,    ...backColor,
        1.0, 1.0, -1.0,     ...backColor,
        -1.0, 1.0, -1.0,    ...backColor,

        // Front
        -1.0, 1.0, 1.0,     ...frontColor,
        -1.0, -1.0, 1.0,    ...frontColor,
        1.0, -1.0, 1.0,     ...frontColor,
        1.0, -1.0, 1.0,     ...frontColor,
        1.0, 1.0, 1.0,      ...frontColor,
        -1.0, 1.0, 1.0,     ...frontColor,

        // top
        -1.0, 1.0, -1.0,    ...topColor,
        1.0, 1.0, 1.0,      ...topColor,
        -1.0, 1.0, 1.0,     ...topColor,
        -1.0, 1.0, -1.0,    ...topColor,
        1.0, 1.0, 1.0,      ...topColor,
        1.0, 1.0, -1.0,     ...topColor,

        // bottom
        -1.0, -1.0, -1.0,   ...bottomColor,
        1.0, -1.0, 1.0,     ...bottomColor,
        -1.0, -1.0, 1.0,    ...bottomColor,
        -1.0, -1.0, -1.0,   ...bottomColor,
        1.0, -1.0, 1.0,     ...bottomColor,
        1.0, -1.0, -1.0,    ...bottomColor,

        // right
        -1.0, -1.0, 1.0,    ...rightColor,
        -1.0, 1.0, -1.0,    ...rightColor,
        -1.0, 1.0, 1.0,     ...rightColor,
        -1.0, 1.0, -1.0,    ...rightColor,
        -1.0, -1.0, 1.0,    ...rightColor,
        -1.0, -1.0, -1.0,   ...rightColor,

        // left
        1.0, -1.0, 1.0,     ...leftColor,
        1.0, 1.0, -1.0,     ...leftColor,
        1.0, 1.0, 1.0,      ...leftColor,
        1.0, 1.0, -1.0,     ...leftColor,
        1.0, -1.0, 1.0,     ...leftColor,
        1.0, -1.0, -1.0,    ...leftColor
    ];
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {Object} shaderProgram
 *
 * @returns {Function}
 */
export function createPlaneCube(gl) {
    const shaderProgram = initShaders(gl);
    const vertices = new Float32Array(createVertices());
    const recordsize = 6;
    const colorOffset = 3;
    const color = [ 0.1, 0.1, 0.5, 1.0 ];

    /** @type {WebGLBuffer} */
    const vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

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
        mat4.rotateZ(mvMatrix, mvMatrix, degToRad(rotation));
        mat4.rotateX(mvMatrix, mvMatrix, degToRad(rotation));

        // Pass model view projection to shader
        gl.uniformMatrix4fv(shaderProgram.transformLocation, false, mvMatrix);
        gl.uniformMatrix4fv(shaderProgram.cameraTransformLocation, false, pMatrix);
        gl.uniform4fv(shaderProgram.colorLocation, new Float32Array(color));

        // Add vertex data and prep the variable type.
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);


        gl.vertexAttribPointer(shaderProgram.positionLocation, 3, gl.FLOAT, false, recordsize * vertices.BYTES_PER_ELEMENT, 0);
        gl.vertexAttribPointer(shaderProgram.aColorLocation, 3, gl.FLOAT, false, recordsize * vertices.BYTES_PER_ELEMENT, colorOffset * vertices.BYTES_PER_ELEMENT);

        //draw it!
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    };
}