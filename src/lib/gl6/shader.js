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