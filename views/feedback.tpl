%from bottle import html_escape
%
%def p(s):
%  """replace all newlines with </p>\n<p>"""
%  rv = ""
%  last = 0
%  for i in range(len(s)):
%    if s[i] == "\n":
%      rv += html_escape(s[last:i])+"</p>\n<p>"
%      last = i+1
%    end
%  end
%  if last < len(s):
%    rv += html_escape(s[last:])
%  end
%  return rv
%end

{{!p(feedback.text)}}
