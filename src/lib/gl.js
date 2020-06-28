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
    precision mediump float;

    void main(void) {
        gl_FragColor = vec4(0.9, 0.3, 0.6, 1.0);
    }
`;

// vertex shader
const vsShader = `
    attribute vec3 Position;

    uniform mat4 u_ModelView;
    uniform mat4 u_Persp;

    void main(void) {
        gl_Position = u_Persp * u_ModelView * vec4(Position, 1.0);
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
    const shader_prog = gl.createProgram();

    gl.attachShader(shader_prog, getVShader(gl, vsShader));
    gl.attachShader(shader_prog, getTShader(gl, fsShader));
    gl.linkProgram(shader_prog);

    if (!gl.getProgramParameter(shader_prog, gl.LINK_STATUS)) {
        throw('Could not initalize shaders!');
    }

    gl.useProgram(shader_prog);

    shader_prog.positionLocation = gl.getAttribLocation(shader_prog, "Position");
    gl.enableVertexAttribArray(shader_prog.positionLocation);

    shader_prog.u_PerspLocation = gl.getUniformLocation(shader_prog, "u_Persp");
    shader_prog.u_ModelViewLocation = gl.getUniformLocation(shader_prog, "u_ModelView");

    return shader_prog;
}

/**
 * @param {WebGLRenderingContext} gl
 *
 * @returns WebGLBuffer
 */
export function initBuffers(gl) {
    /** @type {WebGLBuffer} */
    const triangleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);

    const vertices = [
        0.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    triangleVertexPositionBuffer.itemSize = 3;
    triangleVertexPositionBuffer.numItems = 3;

    return triangleVertexPositionBuffer;
}

export function create(elm) {
    const gl = createCtx(elm);
    const shader_prog = initShaders(gl);
    const triangleVertexPositionBuffer = initBuffers(gl);

    const mvMatrix = mat4.create();
    const pMatrix = mat4.create();

    gl.clearColor(0.75, 0.85, 0.8, 1);
    gl.enable(gl.DEPTH_TEST);

    return () => {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 50.0);

        // move our triangle
        mat4.identity(mvMatrix);
        mat4.translate (mvMatrix, mvMatrix, [0, 0, -4.0]);

        // Pass triangle position to shader
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
        gl.vertexAttribPointer(shader_prog.positionLocation, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        // Pass model view projection to shader
        gl.uniformMatrix4fv(shader_prog.u_PerspLocation, false, pMatrix);
        gl.uniformMatrix4fv(shader_prog.u_ModelViewLocation, false, mvMatrix);

        //draw it!
        gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
    }
}


export function gl(elm) {
    const draw = create(elm);



    draw();
}
