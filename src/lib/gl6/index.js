// cleanup 5
import { mat4 } from "gl-matrix";
import { degToRad } from './misc';
import { createCtx } from './canvas';
import { createPlaneCube } from './planecube';

export function createApp(elm) {
    // Setup webgl
    const gl = createCtx(elm);
    const renderPlane = createPlaneCube(gl);

    gl.clearColor(0.75, 0.85, 0.8, 1);
    gl.enable(gl.DEPTH_TEST);

    // Prepare perspective matrix
    const pMatrix = mat4.create();

    mat4.perspective(pMatrix, degToRad(60), gl.viewportWidth / gl.viewportHeight, 0.1, 50.0);
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
            }, 40);
        }

        render();
    }
}

export function gl(elm) {
    const start = createApp(elm);
    start();
}
