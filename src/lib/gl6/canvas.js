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
