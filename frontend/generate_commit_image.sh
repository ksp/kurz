#!/bin/bash

FILENAME=public/build/build_id.svg


cd $(git rev-parse --show-toplevel)
cd frontend


cat  > $FILENAME <<EOF
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:cc="http://creativecommons.org/ns#"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns="http://www.w3.org/2000/svg"
   width="100mm"
   height="3.2808306mm"
   viewBox="0 0 100 3.2808306"
   version="1.1"
   id="svg8">
  <defs
     id="defs2" />
  <metadata
     id="metadata5">
    <rdf:RDF>
      <cc:Work
         rdf:about="">
        <dc:format>image/svg+xml</dc:format>
        <dc:type
           rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
        <dc:title></dc:title>
      </cc:Work>
    </rdf:RDF>
  </metadata>
  <g
     id="layer1"
     transform="translate(-44.265338,-88.362539)">
    <text
       xml:space="preserve"
       style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:4.23333px;line-height:1.25;font-family:'Noto Sans';-inkscape-font-specification:'Noto Sans';letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none;stroke-width:0.264583"
       x="44.032505"
       y="91.601036"
       id="text835"><tspan
         id="tspan833"
         x="44.032505"
         y="91.601036"
         style="stroke-width:0.264583">
EOF

git rev-parse HEAD >> $FILENAME

cat  >> $FILENAME <<EOF
</tspan></text>
  </g>
</svg>
EOF
