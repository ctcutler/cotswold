<ul>
% for work in works:
  <li><a href="/works/{{work.id}}">{{work.name}}</a></li>
% end
</ul>

<h3>Add New Work</h3>
<form action="/works" method="post" enctype="multipart/form-data">
Work name: <input type="text" name="name"/><br/>
Draft 1: <input type="file" name="draft1"/> Feedback: <input type="file" name="feedback1"/><br/>
Draft 2: <input type="file" name="draft2"/> Feedback: <input type="file" name="feedback2"/><br/>
Draft 3: <input type="file" name="draft3"/> Feedback: <input type="file" name="feedback3"/><br/>
Draft 4: <input type="file" name="draft4"/> Feedback: <input type="file" name="feedback4"/><br/>
Draft 5: <input type="file" name="draft5"/> Feedback: <input type="file" name="feedback5"/><br/>
Draft 6: <input type="file" name="draft6"/> Feedback: <input type="file" name="feedback6"/><br/>
Draft 7: <input type="file" name="draft7"/> Feedback: <input type="file" name="feedback7"/><br/>
Draft 8: <input type="file" name="draft8"/> <br/>
<input type="submit" value="Add"/>
</form>

%rebase base title="List of Works"
