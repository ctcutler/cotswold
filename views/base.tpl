<html>
  <head>
    <title>{{title}}</title>
    <style type="text/css">
        *.add {
            background-color: green;
            border: 1px solid green;
        }
        *.update {
            background-color: yellow;
            border: 1px solid yellow;
        }
        *.remove {
            background-color: red;
            border: 1px solid red;
        }
        *.heightTest {
            position: absolute;
            visibility: hidden;
            height: auto;
            width: auto;
        }
        *.lineSurface {
            position:absolute; 
            top: 0; 
            left: 0; 
            z-index: -1;
        }
    </style>

    <script type="text/javascript" src="/static/rangy-core-1.2.3.js"></script>
    <script type="text/javascript" src="/static/rangy-cssclassapplier-1.2.3.js"></script>
    <script type="text/javascript" src="/static/rangy-textrange-1.3alpha.650.js"></script>
    <script type="text/javascript" src="/static/jquery-1.7.1.js"></script>
    <script type="text/javascript" src="/static/jquery.svg-1.4.4.js"></script>
    <script type="text/javascript" src="/static/lines.js"></script>
    <script type="text/javascript" src="/static/render.js"></script>
  </head>
  <body>
    <div id="heightTest" class="heightTest">ABCDEFGHIJKLMNOPQRSTUVWXYZ</div> 
    <div id="lineSurface" class="lineSurface"></div> 
  <h3>{{title}}</h3>
  %include
  </body>
</html>
