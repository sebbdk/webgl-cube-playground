import { mat4 } from 'gl-matrix';
import { degToRad } from '../misc';
import { getVShader, getTShader } from '../shader';

// B|F|T|B|L|R
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

// B|F|T|B|L|R
export function createNormalData() {
    return [
        ...repeat(6, [0, 0, -1]), // -Z
        ...repeat(6, [0, 0, 1]),  // +Z
        ...repeat(6, [0, 1, 0]),  // +Y
        ...repeat(6, [0, -1, 0]), // -Y
        ...repeat(6, [-1, 0, 0]), // -X
        ...repeat(6, [1, 0, 0]),  // +X
    ]
}

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
    attribute vec3 positionColor;

    uniform vec4 color;
    uniform mat4 transform;
    uniform mat4 cameraTransform;

    // Defined a color output to next shader
    varying lowp vec3 vColor;

    void main(void) {
        gl_Position = cameraTransform * transform * vec4(position, 1);
        vColor = positionColor;
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

    // Buffer position and color using a single buffer
    const positionLocation = gl.getAttribLocation(shaderProgram, "position");
    const positionColorLocation = gl.getAttribLocation(shaderProgram, "positionColor");
    const recordsize = 6;
    const colorOffset = 3;
    const vertices = new Float32Array(createVertices());
    const bpe = vertices.BYTES_PER_ELEMENT;

    const vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Add vertex data and prep the variable type.
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, recordsize * bpe, 0);
    gl.vertexAttribPointer(positionColorLocation, 3, gl.FLOAT, false, recordsize * bpe, colorOffset * bpe);
    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(positionColorLocation);

    return shaderProgram;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {Object} shaderProgram
 *
 * @returns {Function}
 */
export function createColoredPlaneCube(gl) {
    const shaderProgram = initShaders(gl);

    // Position, rotation etc. Matrix
    let mvMatrix = mat4.create();
    let rotation = 0;

    const transformLocation = gl.getUniformLocation(shaderProgram, "transform");
    const cameraTransformLocation = gl.getUniformLocation(shaderProgram, "cameraTransform");

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
        gl.uniformMatrix4fv(transformLocation, false, mvMatrix);
        gl.uniformMatrix4fv(cameraTransformLocation, false, pMatrix);

        //draw it!
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    };
}