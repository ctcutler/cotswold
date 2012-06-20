% from view_helper import escJS
<p>Name: {{work.name}}</p>
<button type="button" id="connectButton">Connect Feedback</button>
<table valign="top" border="1">
%for draftPair in draftPairs:
  <tr valign="top">
    <td valign="top" id="left-draft-{{draftPair["left"].id}}"/>
    <td valign="top" id="feedback-{{draftPair["left"].id}}"/>
    <td valign="top" id="right-draft-{{draftPair["right"].id}}"/>
  </tr>
%end
</table>
<script type="text/javascript">
  var ranges = {};        
  var blocks = [
    %for draftPair in draftPairs:
    {
      element: "left-draft-{{draftPair["left"].id}}",
      text: "{{! escJS(draftPair["left"].text) }}",
      rangeDefs: [
      %for leftChunk in draftPair["leftChunks"]:
        {
          id: "{{leftChunk["name"]}}", 
          offset1: {{leftChunk["offset1"]}}, 
          offset2: {{leftChunk["offset2"]}}, 
          type: "{{leftChunk["changeType"]}}"
        },
      %end
      ],
    },
    {
      element: "right-draft-{{draftPair["right"].id}}",
      text: "{{! escJS(draftPair["right"].text) }}",
      rangeDefs: [
      %for rightChunk in draftPair["rightChunks"]:
        {
          id: "{{rightChunk["name"]}}", 
          offset1: {{rightChunk["offset1"]}}, 
          offset2: {{rightChunk["offset2"]}}, 
          type: "{{rightChunk["changeType"]}}"
        },
      %end
      ],
    },
    {
      element: "feedback-{{draftPair["left"].id}}",
      text: "{{! escJS(draftPair["feedback"].text) }}",
      rangeDefs: [
      %for feedbackChunk in draftPair["feedbackChunks"]:
        {
          id: "{{feedbackChunk["name"]}}", 
          offset1: {{feedbackChunk["offset1"]}}, 
          offset2: {{feedbackChunk["offset2"]}}, 
          type: "{{feedbackChunk["changeType"]}}"
        },
      %end
      ],
    },
    %end
  ];
  var connections = [
%for draftPair in draftPairs:
  %for line in draftPair["lines"]:
    {
      left: "{{line["id1"]}}", 
      right: "{{line["id2"]}}", 
      color: "{{line["color"]}}",
      hightlight: false
    },
  %end
%end
  ];

  var feedbackIds = [
%for draftPair in draftPairs:
    "feedback-{{draftPair["left"].id}}",
%end
  ];

  $('#connectButton').click(connectButtonClicked);
  $(document).ready(load);
  $(window).resize(renderConnections);
</script>
%rebase base title="Work detail"
