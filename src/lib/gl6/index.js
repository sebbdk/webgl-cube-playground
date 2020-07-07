// cleanup 5
import { mat4 } from "gl-matrix";
import { degToRad } from './misc';
import { createCtx } from './canvas';
import { createShadedPlaneCube } from './objects/planecube-shaded';
import { createColoredPlaneCube } from './objects/planecube-colored';
import { createPlaneCube } from './objects/planecube';

/**
 * @param {Element} elm
 */
export function createApp(elm) {
    // Setup webgl
    const gl = createCtx(elm);
    const renderShadedCube = createShadedPlaneCube(gl);
    const renderColorCube = createColoredPlaneCube(gl);
    const renderPlaneCube = createPlaneCube(gl);

    gl.clearColor(0.75, 0.85, 0.8, 1);
    gl.enable(gl.DEPTH_TEST);

    // Prepare perspective matrix
    const pMatrix = mat4.create();
    mat4.perspective(pMatrix, degToRad(60), gl.viewportWidth / gl.viewportHeight, 0.1, 50.0);
    mat4.translate (pMatrix, pMatrix, [-3, 1, -3]); // Use this to move camera around
    //mat4.rotateY(pMatrix, pMatrix, degToRad(30)); // Turn camera

    const p2Matrix = mat4.create();
    mat4.perspective(p2Matrix, degToRad(60), gl.viewportWidth / gl.viewportHeight, 0.1, 50.0);
    mat4.translate (p2Matrix, p2Matrix, [3, 1, -3]); // Use this to move camera around

    const p3Matrix = mat4.create();
    mat4.perspective(p3Matrix, degToRad(60), gl.viewportWidth / gl.viewportHeight, 0.1, 50.0);
    mat4.translate (p3Matrix, p3Matrix, [0, -2, -3]); // Use this to move camera around

    return () => {
        const fps = 10;
        let last = performance.now();

        function render() {
            const delta = performance.now()-last;
            const deltaTime = delta / (1000 / fps);

            last = performance.now();

            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            renderShadedCube(pMatrix, delta);
            renderColorCube(p2Matrix, delta);
            renderPlaneCube(p3Matrix, delta);

            window.requestAnimationFrame(() => {
                // drop frames if called too often
                //render();
            });

            setTimeout(() => {
                render();
            }, 40);
        }

        render();
    }
}

/**
 * @param {Element} elm
 */
export function gl(elm) {
    const start = createApp(elm);
    start();
}
