// make this more like what spantree prints out. . . not literal ranges but instead
// nested chunks of content, some with span ids

var nested1 = [
  {"start":0,"end":1,"content":"F"},
  {
    "class":"red allborders",
    "nodes": [
      {"start":1,"end":3,"content":"oo"},
      {
        "class":"blue allborders",
        "nodes": [
          {"start":3,"end":5,"content":" b"},
          {
            "class":"green allborders",
            "nodes":[
              {"start":5,"end":6,"content":"a"}
            ],
            "id":"range3"
          },
          {"start":6,"end":8,"content":"r "}
        ],
        "id":"range2"
      },
      {"start":8,"end":10,"content":"ba"}
    ],
    "id":"range1"
  },
  {"start":10,"end":11,"content":"z"}
];

var nested2 = [
  {"start":0,"end":1,"content":"F"},
  {
    "class":"red allborders",
    "nodes": [
      {"start":1,"end":3,"content":"oo"},
      {
        "class":"blue allborders",
        "nodes": [
          {"start":3,"end":5,"content":" b"},
          {
            "class":"green allborders",
            "nodes":[
              {"start":5,"end":6,"content":"a"}
            ],
            "id":"range6"
          },
          {"start":6,"end":8,"content":"r "}
        ],
        "id":"range5"
      },
      {"start":8,"end":10,"content":"ba"}
    ],
    "id":"range4"
  },
  {"start":10,"end":11,"content":"z"}
];

var simple1 = [
  {"content":"Foo bar baz"},
];

var timeline = [
  [
    {
      nodes: nested1,
    },
    {
      nodes: simple1,
    },
  ],
  [
    {
      nodes: nested2,
    },
    {
      imageSrc: "img/baa.jpeg",
    },
  ],
];

var connectionEnds = [
  "range1", "range6" 
];

var connections = [
  [ "range3", "range6"],
];
