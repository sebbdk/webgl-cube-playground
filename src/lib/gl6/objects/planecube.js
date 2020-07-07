import { mat4 } from 'gl-matrix';
import { degToRad } from '../misc';
import { getVShader, getTShader } from '../shader';

// Fragment shader
export const fsShader = `
    varying lowp vec4 vColor;

    void main(void) {
        gl_FragColor = vColor;
    }
`;

// vertex shader
export const vsShader = `
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
    shaderProgram.transformLocation = gl.getUniformLocation(shaderProgram, "transform");
    shaderProgram.colorLocation = gl.getUniformLocation(shaderProgram, "color");
    shaderProgram.cameraTransformLocation = gl.getUniformLocation(shaderProgram, "cameraTransform");

    gl.enableVertexAttribArray(shaderProgram.positionLocation);

    return shaderProgram;
}

export function createVertices() {
    return [
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
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {Object} shaderProgram
 *
 * @returns {Function}
 */
export function createPlaneCube(gl) {
    const shaderProgram = initShaders(gl);
    const vertices = createVertices();
    const color = [ 0.5, 0.0, 0.5, 1.0 ];

    /** @type {WebGLBuffer} */
    const vertBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Position, rotation etc. Matrix
    let mvMatrix = mat4.create();
    let rotation = 0;

    // Add vertex data and prep the variable type.
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.enableVertexAttribArray(shaderProgram.positionLocation);
    gl.vertexAttribPointer(shaderProgram.positionLocation, 3, gl.FLOAT, false, 0, 0);

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

        //draw it!
        gl.drawArrays(gl.TRIANGLES, 0, 33);
    };
}