function initialize()
{
    var canvas;
    var graphicsLibrary;
    var canvasRatio;
    var vertices;
    var velocities;
    var colorLocation;
    var canvasWidth;
    var canvasHeight;
    var colorRed = 0;
    var colorGreen = 0;
    var colorBlue = 0;
    var colorTransformRed;
    var colorTransformGreen;
    var colorTransformBlue;
    var touchPoint = [ ];
    var totalLines = 60000;
    var lineCount = totalLines;

    loadScene();

    document.addEventListener("mousedown", onMouseDown, false);
    window.addEventListener("resize", onResize, false);
    onResize(null);

    animate();

    function animate()
    {
        requestAnimationFrame(animate);
        redraw();
    }

    function normalize(pointX, pointY)
    {
        touchPoint[0] = (pointX / canvasWidth - .5) * 3;
        touchPoint[1] = (pointY / canvasHeight - .5) * -2;
    }

    function onMouseDown(event)
    {
        normalize(event.pageX, event.pageY);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        event.preventDefault();
    }

    function onMouseMove(event)
    {
        normalize(event.pageX, event.pageY);
    }

    function onMouseUp(event)
    {
        touchPoint = [ ];
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }

    function onResize(event)
    {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
    }

    function redraw()
    {
        var p;

        colorRed = colorRed * .99 + colorTransformRed * .01;
        colorGreen = colorGreen * .99 + colorTransformGreen * .01;
        colorBlue = colorBlue * .99 + colorTransformBlue * .01;

        graphicsLibrary.uniform4f(
            colorLocation,
            colorRed,
            colorGreen,
            colorBlue,
            .5);

        for (var lineIndex = 0; lineIndex < lineCount; lineIndex += 2)
        {
            var arrayIndex = lineIndex * 3;

            // Copy old positions
            vertices[arrayIndex] = vertices[arrayIndex + 3];
            vertices[arrayIndex + 1] = vertices[arrayIndex + 4];

            // Calculate inertia
            velocities[arrayIndex] *= velocities[arrayIndex + 2];
            velocities[arrayIndex + 1] *= velocities[arrayIndex + 2];

            // Horizontal
            p = vertices[arrayIndex + 3];
            p += velocities[arrayIndex];
            if (p < -canvasRatio)
            {
                p = -canvasRatio;
                velocities[arrayIndex] =
                    Math.abs(velocities[arrayIndex]);
            }
            else if (p > canvasRatio)
            {
                p = canvasRatio;
                velocities[arrayIndex] =
                    -Math.abs(velocities[arrayIndex]);
            }
            vertices[arrayIndex + 3] = p;

            // Vertical
            p = vertices[arrayIndex + 4];
            p += velocities[arrayIndex + 1];
            if (p < -1)
            {
                p = -1;
                velocities[arrayIndex + 1] =
                    Math.abs(velocities[arrayIndex + 1]);
            }
            else if (p > 1)
            {
                p = 1;
                velocities[arrayIndex + 1] =
                    -Math.abs(velocities[arrayIndex + 1]);

            }
            vertices[arrayIndex + 4] = p;

            if (touchPoint.length)
            {
                var changeX = touchPoint[0] - vertices[arrayIndex];
                var changeY = touchPoint[1] - vertices[arrayIndex+1];
                var distance = Math.sqrt(
                    changeX * changeX +
                    changeY * changeY);

                if (distance < 2 && distance >= .03)
                {
                    changeX /= distance;
                    changeY /= distance;
                    distance = Math.pow((2 - distance) / 2, 2);
                    velocities[arrayIndex] += changeX * distance * .01;
                    velocities[arrayIndex + 1] += changeY * distance * .01;
                }
            }
        }

        graphicsLibrary.clear(
            graphicsLibrary.COLOR_BUFFER_BIT |
            graphicsLibrary.DEPTH_BUFFER_BIT);
        graphicsLibrary.bufferData(
            graphicsLibrary.ARRAY_BUFFER,
            vertices,
            graphicsLibrary.DYNAMIC_DRAW);
        graphicsLibrary.lineWidth(2.6);
        graphicsLibrary.drawArrays(graphicsLibrary.LINES, 0, lineCount);
        graphicsLibrary.flush();
    }

    function changeColor()
    {
        var colorTransform1 = Math.random() * .2 + .3;
        var colorTransform2 = Math.random() * .06 + .01;
        var colorTransform3 = Math.random() * .06 + .02;

        switch (Math.floor(Math.random() * 3))
        {
            case 0:
            {
                colorTransformRed = colorTransform1;
                colorTransformGreen = colorTransform2;
                colorTransformBlue = colorTransform3;
                break;
            }
            case 1:
            {
                colorTransformRed = colorTransform2;
                colorTransformGreen = colorTransform1;
                colorTransformBlue = colorTransform3;
                break;
            }
            case 2:
            {
                colorTransformRed = colorTransform3;
                colorTransformGreen = colorTransform2;
                colorTransformBlue = colorTransform1;
                break;
            }
        }

        window.setTimeout(changeColor, 1000);
    }

    function loadScene()
    {
        canvas = document.getElementById("webGLCanvas");
        graphicsLibrary = canvas.getContext("experimental-webgl");

        if (!graphicsLibrary)
        {
            alert("No WebGL context");
            return;
        }

        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        graphicsLibrary.viewport(0, 0, canvas.width, canvas.height);

        var vertexShaderScript = document.getElementById("vertexShader");
        var vertexShader = graphicsLibrary.createShader(
            graphicsLibrary.VERTEX_SHADER);
        graphicsLibrary.shaderSource(vertexShader, vertexShaderScript.text);
        graphicsLibrary.compileShader(vertexShader);
        if (!graphicsLibrary.getShaderParameter(
            vertexShader,
            graphicsLibrary.COMPILE_STATUS))

        {
            alert("Could not compile vertex shader");
            graphicsLibrary.deleteShader(vertexShader);
            return;
        }

        var fragmentShaderScript = document.getElementById("fragmentShader");
        var fragmentShader = graphicsLibrary.createShader(
            graphicsLibrary.FRAGMENT_SHADER);
        graphicsLibrary.shaderSource(
            fragmentShader,
            fragmentShaderScript.text);
        graphicsLibrary.compileShader(fragmentShader);
        if (!graphicsLibrary.getShaderParameter(
            fragmentShader,
            graphicsLibrary.COMPILE_STATUS))

        {
            alert("Could not compile shader fragment");
            graphicsLibrary.deleteShader(fragmentShader);
            return;
        }

        graphicsLibrary.program = graphicsLibrary.createProgram();
        graphicsLibrary.attachShader(graphicsLibrary.program, vertexShader);
        graphicsLibrary.attachShader(graphicsLibrary.program, fragmentShader);
        graphicsLibrary.linkProgram(graphicsLibrary.program);
        if (!graphicsLibrary.getProgramParameter(
            graphicsLibrary.program,
            graphicsLibrary.LINK_STATUS))

        {
            alert("Could not initialise shaders");
            graphicsLibrary.deleteProgram(graphicsLibrary.program);
            graphicsLibrary.deleteProgram(vertexShader);
            graphicsLibrary.deleteProgram(fragmentShader);
            return;
        }
        graphicsLibrary.useProgram(graphicsLibrary.program);

        colorLocation = graphicsLibrary.getUniformLocation(
            graphicsLibrary.program,
            "color");
        graphicsLibrary.uniform4f(colorLocation, 0.4, 0.01, 0.08, 0.5);
        graphicsLibrary.enableVertexAttribArray(
            graphicsLibrary.getAttribLocation(
                graphicsLibrary.program,
                "vertexPosition"));
        graphicsLibrary.clearColor(0.0, 0.0, 0.0, 1.0);
        graphicsLibrary.clearDepth(1.0);
        graphicsLibrary.enable(graphicsLibrary.BLEND);
        graphicsLibrary.disable(graphicsLibrary.DEPTH_TEST);
        graphicsLibrary.blendFunc(
            graphicsLibrary.SRC_ALPHA,
            graphicsLibrary.ONE);

        var vertexBuffer = graphicsLibrary.createBuffer();
        graphicsLibrary.bindBuffer(
            graphicsLibrary.ARRAY_BUFFER,
            vertexBuffer);

        vertices = [ ];
        velocities = [ ];
        canvasRatio = canvasWidth / canvasHeight;
        for (var lineIndex = 0; lineIndex < totalLines; lineIndex++)
        {
            vertices.push(0, 0, 1.83);
            velocities.push(
                (Math.random() * 2 - 1) * .05,
                (Math.random() * 2 - 1) * .05,
                .93 + Math.random() * .02);
        }
        vertices = new Float32Array(vertices);
        velocities = new Float32Array(velocities);

        graphicsLibrary.bufferData(
            graphicsLibrary.ARRAY_BUFFER,
            vertices,
            graphicsLibrary.DYNAMIC_DRAW);
        graphicsLibrary.clear(
            graphicsLibrary.COLOR_BUFFER_BIT |
            graphicsLibrary.DEPTH_BUFFER_BIT);

        var fieldOfView = 30.0;
        var aspectRatio = canvas.width / canvas.height;
        var nearPlane = 1.0;
        var farPlane = 10000.0;
        var top = nearPlane * Math.tan(fieldOfView * Math.PI / 360.0);
        var bottom = -top;
        var right = top * aspectRatio;
        var left = -right;
        var a = (right + left) / (right - left);
        var b = (top + bottom) / (top - bottom);
        var c = (farPlane + nearPlane) / (farPlane - nearPlane);
        var d = (2 * farPlane * nearPlane) / (farPlane - nearPlane);
        var x = (2 * nearPlane) / (right - left);
        var y = (2 * nearPlane) / (top - bottom);

        var perspectiveMatrix =
        [
            x, 0, a, 0,
            0, y, b, 0,
            0, 0, c, d,
            0, 0, -1, 0
        ];
        var modelViewMatrix =
        [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];

        var vertexPositionAttribLocation = graphicsLibrary.getAttribLocation(
            graphicsLibrary.program,
            "vertexPosition");
        graphicsLibrary.vertexAttribPointer(
            vertexPositionAttribLocation,
            3.0,
            graphicsLibrary.FLOAT,
            false,
            0,
            0);
        var uniformModelViewMatrix = graphicsLibrary.getUniformLocation(
            graphicsLibrary.program,
            "modelViewMatrix");
        var uniformPerspectiveMatrix = graphicsLibrary.getUniformLocation(
            graphicsLibrary.program,
            "perspectiveMatrix");
        graphicsLibrary.uniformMatrix4fv(
            uniformModelViewMatrix,
            false,
            new Float32Array(perspectiveMatrix));
        graphicsLibrary.uniformMatrix4fv(
            uniformPerspectiveMatrix,
            false,
            new Float32Array(modelViewMatrix));

        changeColor();
    }
}