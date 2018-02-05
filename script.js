(function($){$.fn.htmlClean=function(options){return this.each(function(){if(this.value){this.value=$.htmlClean(this.value,options)}else{this.innerHTML=$.htmlClean(this.innerHTML,options)}})};$.htmlClean=function(html,options){options=$.extend({},$.htmlClean.defaults,options);options.allowEmpty=tagAllowEmpty.concat(options.allowEmpty);var tagsRE=/(<(\/)?(\w+:)?([\w]+)([^>]*)>)|<!--(.*?--)>/gi;var attrsRE=/([\w\-]+)\s*=\s*(".*?"|'.*?'|[^\s>\/]*)/gi;var tagMatch;var root=new Element();var stack=[root];var container=root;if(options.bodyOnly){if(tagMatch=/<body[^>]*>((\n|.)*)<\/body>/i.exec(html)){html=tagMatch[1]}}html=html.concat("<xxx>");var lastIndex;while(tagMatch=tagsRE.exec(html)){var tag=tagMatch[6]?new Tag("--",null,tagMatch[6],options):new Tag(tagMatch[4],tagMatch[2],tagMatch[5],options);var text=html.substring(lastIndex,tagMatch.index);if(text.length>0){var child=container.children[container.children.length-1];if(container.children.length>0&&isText(child=container.children[container.children.length-1])){container.children[container.children.length-1]=child.concat(text)}else{container.children.push(text)}}lastIndex=tagsRE.lastIndex;if(tag.isClosing){if(popToTagName(stack,[tag.name])){stack.pop();container=stack[stack.length-1]}}else{var element=new Element(tag);var attrMatch;while(attrMatch=attrsRE.exec(tag.rawAttributes)){if(attrMatch[1].toLowerCase()=="style"&&options.replaceStyles){var renderParent=!tag.isInline;for(var i=0;i<options.replaceStyles.length;i++){if(options.replaceStyles[i][0].test(attrMatch[2])){if(!renderParent){tag.render=false;renderParent=true}container.children.push(element);stack.push(element);container=element;tag=new Tag(options.replaceStyles[i][1],"","",options);element=new Element(tag)}}}if(tag.allowedAttributes!=null&&(tag.allowedAttributes.length==0||$.inArray(attrMatch[1],tag.allowedAttributes)>-1)){element.attributes.push(new Attribute(attrMatch[1],attrMatch[2]))}}$.each(tag.requiredAttributes,function(){var name=this.toString();if(!element.hasAttribute(name)){element.attributes.push(new Attribute(name,""))}});for(var repIndex=0;repIndex<options.replace.length;repIndex++){for(var tagIndex=0;tagIndex<options.replace[repIndex][0].length;tagIndex++){var byName=typeof(options.replace[repIndex][0][tagIndex])=="string";if((byName&&options.replace[repIndex][0][tagIndex]==tag.name)||(!byName&&options.replace[repIndex][0][tagIndex].test(tagMatch))){tag.rename(options.replace[repIndex][1]);repIndex=options.replace.length;break}}}var add=true;if(!container.isRoot){if(container.tag.isInline&&!tag.isInline){if(add=popToContainer(stack)){container=stack[stack.length-1]}}else{if(container.tag.disallowNest&&tag.disallowNest&&!tag.requiredParent){add=false}else{if(tag.requiredParent){if(add=popToTagName(stack,tag.requiredParent)){container=stack[stack.length-1]}}}}}if(add){container.children.push(element);if(tag.toProtect){var tagMatch2;while(tagMatch2=tagsRE.exec(html)){var tag2=new Tag(tagMatch2[4],tagMatch2[1],tagMatch2[5],options);if(tag2.isClosing&&tag2.name==tag.name){element.children.push(RegExp.leftContext.substring(lastIndex));lastIndex=tagsRE.lastIndex;break}}}else{if(!tag.isSelfClosing&&!tag.isNonClosing){stack.push(element);container=element}}}}}return $.htmlClean.trim(render(root,options).join(""))};$.htmlClean.defaults={bodyOnly:true,allowedTags:[],removeTags:["basefont","center","dir","font","frame","frameset","iframe","isindex","menu","noframes","s","strike","u"],removeTagsAndContent:[],allowedAttributes:[],removeAttrs:[],allowedClasses:[],format:false,formatIndent:0,replace:[[["b","big"],"strong"],[["i"],"em"]],replaceStyles:[[/font-weight:\s*bold/i,"strong"],[/font-style:\s*italic/i,"em"],[/vertical-align:\s*super/i,"sup"],[/vertical-align:\s*sub/i,"sub"]],allowComments:false,allowEmpty:[]};function applyFormat(element,options,output,indent){if(element.tag.format&&output.length>0){output.push("\n");for(var i=0;i<indent;i++){output.push("\t")}}}function render(element,options){var output=[],empty=element.attributes.length==0,indent=0;if(element.tag.isComment){if(options.allowComments){output.push("<!--");output.push(element.tag.rawAttributes);output.push(">");if(options.format){applyFormat(element,options,output,indent-1)}}}else{var renderChildren=(options.removeTagsAndContent.length==0||$.inArray(element.tag.name,options.removeTagsAndContent)==-1);var renderTag=renderChildren&&element.tag.render&&(options.allowedTags.length==0||$.inArray(element.tag.name,options.allowedTags)>-1)&&(options.removeTags.length==0||$.inArray(element.tag.name,options.removeTags)==-1);if(!element.isRoot&&renderTag){output.push("<");output.push(element.tag.name);$.each(element.attributes,function(){if($.inArray(this.name,options.removeAttrs)==-1){var m=RegExp(/^(['"]?)(.*?)['"]?$/).exec(this.value);var value=m[2];var valueQuote=m[1]||"'";if(this.name=="class"&&options.allowedClasses.length>0){value=$.grep(value.split(" "),function(c){return $.grep(options.allowedClasses,function(a){return a==c||(a[0]==c&&(a.length==1||$.inArray(element.tag.name,a[1])>-1))}).length>0}).join(" ")}if(value!=null&&(value.length>0||$.inArray(this.name,element.tag.requiredAttributes)>-1)){output.push(" ");output.push(this.name);output.push("=");output.push(valueQuote);output.push(value);output.push(valueQuote)}}})}if(element.tag.isSelfClosing){if(renderTag){output.push(" />")}empty=false}else{if(element.tag.isNonClosing){empty=false}else{if(renderChildren){if(!element.isRoot&&renderTag){output.push(">")}indent=options.formatIndent++;if(element.tag.toProtect){outputChildren=$.htmlClean.trim(element.children.join("")).replace(/<br>/ig,"\n");output.push(outputChildren);empty=outputChildren.length==0}else{var outputChildren=[];for(var i=0;i<element.children.length;i++){var child=element.children[i];var text=$.htmlClean.trim(textClean(isText(child)?child:child.childrenToString()));if(isInline(child)){if(i>0&&text.length>0&&(startsWithWhitespace(child)||endsWithWhitespace(element.children[i-1]))){outputChildren.push(" ")}}if(isText(child)){if(text.length>0){outputChildren.push(text)}}else{if(i!=element.children.length-1||child.tag.name!="br"){if(options.format){applyFormat(child,options,outputChildren,indent)}outputChildren=outputChildren.concat(render(child,options))}}}options.formatIndent--;if(outputChildren.length>0){if(options.format&&outputChildren[0]!="\n"){applyFormat(element,options,output,indent)}output=output.concat(outputChildren);empty=false}}if(!element.isRoot&&renderTag){if(options.format){applyFormat(element,options,output,indent-1)}output.push("</");output.push(element.tag.name);output.push(">")}}}}if(!element.tag.allowEmpty&&empty){return[]}}return output}function popToTagName(stack,tagNameArray){return pop(stack,function(element){return $.inArray(element.tag.nameOriginal,tagNameArray)>-1})}function popToContainer(stack){return pop(stack,function(element){return element.isRoot||!element.tag.isInline})}function pop(stack,test,index){index=index||1;var element=stack[stack.length-index];if(test(element)){return true}else{if(stack.length-index>0&&pop(stack,test,index+1)){stack.pop();return true}}return false}function Element(tag){if(tag){this.tag=tag;this.isRoot=false}else{this.tag=new Tag("root");this.isRoot=true}this.attributes=[];this.children=[];this.hasAttribute=function(name){for(var i=0;i<this.attributes.length;i++){if(this.attributes[i].name==name){return true}}return false};this.childrenToString=function(){return this.children.join("")};return this}function Attribute(name,value){this.name=name;this.value=value;return this}function Tag(name,close,rawAttributes,options){this.name=name.toLowerCase();this.nameOriginal=this.name;this.render=true;this.init=function(){if(this.name=="--"){this.isComment=true;this.isSelfClosing=true;this.format=true}else{this.isComment=false;this.isSelfClosing=$.inArray(this.name,tagSelfClosing)>-1;this.isNonClosing=$.inArray(this.name,tagNonClosing)>-1;this.isClosing=(close!=undefined&&close.length>0);this.isInline=$.inArray(this.name,tagInline)>-1;this.disallowNest=$.inArray(this.name,tagDisallowNest)>-1;this.requiredParent=tagRequiredParent[$.inArray(this.name,tagRequiredParent)+1];this.allowEmpty=options&&$.inArray(this.name,options.allowEmpty)>-1;this.toProtect=$.inArray(this.name,tagProtect)>-1;this.format=$.inArray(this.name,tagFormat)>-1||!this.isInline}this.rawAttributes=rawAttributes;this.requiredAttributes=tagAttributesRequired[$.inArray(this.name,tagAttributesRequired)+1];if(options){if(!options.tagAttributesCache){options.tagAttributesCache=[]}if($.inArray(this.name,options.tagAttributesCache)==-1){var cacheItem=tagAttributes[$.inArray(this.name,tagAttributes)+1].slice(0);for(var i=0;i<options.allowedAttributes.length;i++){var attrName=options.allowedAttributes[i][0];if((options.allowedAttributes[i].length==1||$.inArray(this.name,options.allowedAttributes[i][1])>-1)&&$.inArray(attrName,cacheItem)==-1){cacheItem.push(attrName)}}options.tagAttributesCache.push(this.name);options.tagAttributesCache.push(cacheItem)}this.allowedAttributes=options.tagAttributesCache[$.inArray(this.name,options.tagAttributesCache)+1]}};this.init();this.rename=function(newName){this.name=newName;this.init()};return this}function startsWithWhitespace(item){while(isElement(item)&&item.children.length>0){item=item.children[0]}if(!isText(item)){return false}var text=textClean(item);return text.length>0&&$.htmlClean.isWhitespace(text.charAt(0))}function endsWithWhitespace(item){while(isElement(item)&&item.children.length>0){item=item.children[item.children.length-1]}if(!isText(item)){return false}var text=textClean(item);return text.length>0&&$.htmlClean.isWhitespace(text.charAt(text.length-1))}function isText(item){return item.constructor==String}function isInline(item){return isText(item)||item.tag.isInline}function isElement(item){return item.constructor==Element}function textClean(text){return text.replace(/&nbsp;|\n/g," ").replace(/\s\s+/g," ")}$.htmlClean.trim=function(text){return $.htmlClean.trimStart($.htmlClean.trimEnd(text))};$.htmlClean.trimStart=function(text){return text.substring($.htmlClean.trimStartIndex(text))};$.htmlClean.trimStartIndex=function(text){for(var start=0;start<text.length-1&&$.htmlClean.isWhitespace(text.charAt(start));start++){}return start};$.htmlClean.trimEnd=function(text){return text.substring(0,$.htmlClean.trimEndIndex(text))};$.htmlClean.trimEndIndex=function(text){for(var end=text.length-1;end>=0&&$.htmlClean.isWhitespace(text.charAt(end));end--){}return end+1};$.htmlClean.isWhitespace=function(c){return $.inArray(c,whitespace)!=-1};var tagInline=["a","abbr","acronym","address","b","big","br","button","caption","cite","code","del","em","font","hr","i","input","img","ins","label","legend","map","q","s","samp","select","option","param","small","span","strike","strong","sub","sup","tt","u","var"];var tagFormat=["address","button","caption","code","input","label","legend","select","option","param"];var tagDisallowNest=["h1","h2","h3","h4","h5","h6","p","th","td","object"];var tagAllowEmpty=["th","td"];var tagRequiredParent=[null,"li",["ul","ol"],"dt",["dl"],"dd",["dl"],"td",["tr"],"th",["tr"],"tr",["table","thead","tbody","tfoot"],"thead",["table"],"tbody",["table"],"tfoot",["table"],"param",["object"]];var tagProtect=["script","style","pre","code"];var tagSelfClosing=["area","base","br","col","command","embed","hr","img","input","keygen","link","meta","param","source","track","wbr"];var tagNonClosing=["!doctype","?xml"];var tagAttributes=[["class"],"?xml",[],"!doctype",[],"a",["accesskey","class","href","name","title","rel","rev","type","tabindex"],"abbr",["class","title"],"acronym",["class","title"],"blockquote",["cite","class"],"button",["class","disabled","name","type","value"],"del",["cite","class","datetime"],"form",["accept","action","class","enctype","method","name"],"iframe",["class","height","name","sandbox","seamless","src","srcdoc","width"],"input",["accept","accesskey","alt","checked","class","disabled","ismap","maxlength","name","size","readonly","src","tabindex","type","usemap","value"],"img",["alt","class","height","src","width"],"ins",["cite","class","datetime"],"label",["accesskey","class","for"],"legend",["accesskey","class"],"link",["href","rel","type"],"meta",["content","http-equiv","name","scheme","charset"],"map",["name"],"optgroup",["class","disabled","label"],"option",["class","disabled","label","selected","value"],"q",["class","cite"],"script",["src","type"],"select",["class","disabled","multiple","name","size","tabindex"],"style",["type"],"table",["class","summary"],"th",["class","colspan","rowspan"],"td",["class","colspan","rowspan"],"textarea",["accesskey","class","cols","disabled","name","readonly","rows","tabindex"],"param",["name","value"],"embed",["height","src","type","width"]];var tagAttributesRequired=[[],"img",["alt"]];var whitespace=[" "," ","\t","\n","\r","\f"]})(jQuery);
/*
 * to-markdown - an HTML to Markdown converter
 *
 * Copyright 2011, Dom Christie
 * Licenced under the MIT licence
 *
 */

var toMarkdown = function(string) {
  
  var ELEMENTS = [
	{
	  patterns: 'p',
	  replacement: function(str, attrs, innerHTML) {
		return innerHTML ? '\n\n' + innerHTML + '\n' : '';
	  }
	},
	{
	  patterns: 'br',
	  type: 'void',
	  replacement: '\n'
	},
	{
	  patterns: 'h([1-6])',
	  replacement: function(str, hLevel, attrs, innerHTML) {
		var hPrefix = '';
		for(var i = 0; i < hLevel; i++) {
		  hPrefix += '#';
		}
		return '\n\n' + hPrefix + ' ' + innerHTML + '\n';
	  }
	},
	{
	  patterns: 'hr',
	  type: 'void',
	  replacement: '\n\n* * *\n'
	},
	{
	  patterns: 'a',
	  replacement: function(str, attrs, innerHTML) {
		var href = attrs.match(attrRegExp('href')),
			title = attrs.match(attrRegExp('title'));
		return href ? '[' + innerHTML + ']' + '(' + href[1] + (title && title[1] ? ' "' + title[1] + '"' : '') + ')' : str;
	  }
	},
	{
	  patterns: ['b', 'strong'],
	  replacement: function(str, attrs, innerHTML) {
		return innerHTML ? '**' + innerHTML + '**' : '';
	  }
	},
	{
	  patterns: ['i', 'em'],
	  replacement: function(str, attrs, innerHTML) {
		return innerHTML ? '_' + innerHTML + '_' : '';
	  }
	},
	{
	  patterns: 'code',
	  replacement: function(str, attrs, innerHTML) {
		return innerHTML ? '`' + innerHTML + '`' : '';
	  }
	},
	{
	  patterns: 'img',
	  type: 'void',
	  replacement: function(str, attrs, innerHTML) {
		var src = attrs.match(attrRegExp('src')),
			alt = attrs.match(attrRegExp('alt')),
			title = attrs.match(attrRegExp('title'));
		return '![' + (alt && alt[1] ? alt[1] : '') + ']' + '(' + src[1] + (title && title[1] ? ' "' + title[1] + '"' : '') + ')';
	  }
	}
  ];
  
  for(var i = 0, len = ELEMENTS.length; i < len; i++) {
	if(typeof ELEMENTS[i].patterns === 'string') {
	  string = replaceEls(string, { tag: ELEMENTS[i].patterns, replacement: ELEMENTS[i].replacement, type:  ELEMENTS[i].type });
	}
	else {
	  for(var j = 0, pLen = ELEMENTS[i].patterns.length; j < pLen; j++) {
		string = replaceEls(string, { tag: ELEMENTS[i].patterns[j], replacement: ELEMENTS[i].replacement, type:  ELEMENTS[i].type });
	  }
	}
  }
  
  function replaceEls(html, elProperties) {
	var pattern = elProperties.type === 'void' ? '<' + elProperties.tag + '\\b([^>]*)\\/?>' : '<' + elProperties.tag + '\\b([^>]*)>([\\s\\S]*?)<\\/' + elProperties.tag + '>',
		regex = new RegExp(pattern, 'gi'),
		markdown = '';
	if(typeof elProperties.replacement === 'string') {
	  markdown = html.replace(regex, elProperties.replacement);
	}
	else {
	  markdown = html.replace(regex, function(str, p1, p2, p3) {
		return elProperties.replacement.call(this, str, p1, p2, p3);
	  });
	}
	return markdown;
  }
  
  function attrRegExp(attr) {
	return new RegExp(attr + '\\s*=\\s*["\']?([^"\']*)["\']?', 'i');
  }
  
  // Pre code blocks
  
  string = string.replace(/<pre\b[^>]*>`([\s\S]*)`<\/pre>/gi, function(str, innerHTML) {
	innerHTML = innerHTML.replace(/^\t+/g, '  '); // convert tabs to spaces (you know it makes sense)
	innerHTML = innerHTML.replace(/\n/g, '\n    ');
	return '\n\n    ' + innerHTML + '\n';
  });
  
  // Lists

  // Escape numbers that could trigger an ol
  // If there are more than three spaces before the code, it would be in a pre tag
  // Make sure we are escaping the period not matching any character
  string = string.replace(/^(\s{0,3}\d+)\. /g, '$1\\. ');
  
  // Converts lists that have no child lists (of same type) first, then works it's way up
  var noChildrenRegex = /<(ul|ol)\b[^>]*>(?:(?!<ul|<ol)[\s\S])*?<\/\1>/gi;
  while(string.match(noChildrenRegex)) {
	string = string.replace(noChildrenRegex, function(str) {
	  return replaceLists(str);
	});
  }
  
  function replaceLists(html) {
	
	html = html.replace(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi, function(str, listType, innerHTML) {
	  var lis = innerHTML.split('</li>');
	  lis.splice(lis.length - 1, 1);
	  
	  for(i = 0, len = lis.length; i < len; i++) {
		if(lis[i]) {
		  var prefix = (listType === 'ol') ? (i + 1) + ".  " : "*   ";
		  lis[i] = lis[i].replace(/\s*<li[^>]*>([\s\S]*)/i, function(str, innerHTML) {
			
			innerHTML = innerHTML.replace(/^\s+/, '');
			innerHTML = innerHTML.replace(/\n\n/g, '\n\n    ');
			// indent nested lists
			innerHTML = innerHTML.replace(/\n([ ]*)+(\*|\d+\.) /g, '\n$1    $2 ');
			return prefix + innerHTML;
		  });
		}
	  }
	  return lis.join('\n');
	});
	return '\n\n' + html.replace(/[ \t]+\n|\s+$/g, '');
  }
  
  // Blockquotes
  var deepest = /<blockquote\b[^>]*>((?:(?!<blockquote)[\s\S])*?)<\/blockquote>/gi;
  while(string.match(deepest)) {
	string = string.replace(deepest, function(str) {
	  return replaceBlockquotes(str);
	});
  }
  
  function replaceBlockquotes(html) {
	html = html.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, function(str, inner) {
	  inner = inner.replace(/^\s+|\s+$/g, '');
	  inner = cleanUp(inner);
	  inner = inner.replace(/^/gm, '> ');
	  inner = inner.replace(/^(>([ \t]{2,}>)+)/gm, '> >');
	  return inner;
	});
	return html;
  }
  
  function cleanUp(string) {
	string = string.replace(/^[\t\r\n]+|[\t\r\n]+$/g, ''); // trim leading/trailing whitespace
	string = string.replace(/\n\s+\n/g, '\n\n');
	string = string.replace(/\n{3,}/g, '\n\n'); // limit consecutive linebreaks to 2
	return string;
  }
  
  return cleanUp(string);
};

if (typeof exports === 'object') {
  exports.toMarkdown = toMarkdown;
}

var oT = {};

(function(){
	

oT.media = {};
oT.player = function(){};
oT.player.playPause = function(){};
oT.player.skipTo = function(){};
oT.player.skip = function(){};
oT.player.speed = function(){};

oT.media.create = function(opts){
	oT.media.reset({
		callback: function(){
			oT.player = new oT.playerObj(opts);
		}
	});
	oT.input.hide();
	setInterval(function(){
		adjustPlayerWidth();
	},500);
}

oT.playerObj = function(opts){
	var that = this;
	this.file = opts.file;
	if (opts.startpoint) {
		this._startPoint = opts.startpoint;
	}
	if (this.file.indexOf && oT.media.ytParse(this.file)) {
		this.format = 'youtube';
		$('#player-time').hide();
		this._buildYoutube();
	} else {
		var url = this._createObjectURL(opts.file);
		if ( this.file.type.indexOf("video") > -1 ) {
			this._buildVideo(url);
			this.format = 'video';
		} else {
			this._buildAudio(url);
			this.format = 'audio';
		}
		this.title = this.file.name;
		this._initProgressor();
	}
	this.paused = true;
}
oT.playerObj.prototype._initProgressor = function(){
	this.progressBar = new Progressor({
		media : this.element,
		bar : $('#player-hook')[0],
		text : this.title,
		time : $('#player-time')[0]
	});
}

oT.playerObj.prototype._createObjectURL = function(file){
	if (window.webkitURL) {
		return window.webkitURL.createObjectURL(file);
	} else {
		return window.URL.createObjectURL(file);      
	}
}
oT.playerObj.prototype._buildVideo = function(url){
	this.element = document.createElement('video');
	this.element.src = url;
	this.element.id = "media";
	this.element.style.width = oT.media.videoWidth();
	document.body.appendChild(this.element); 
}
oT.playerObj.prototype._buildAudio = function(url){
	this.element = document.createElement('audio');
	this.element.src = url;
	this.element.id = "media";
	$('#player-hook').append(this.element);
}
oT.playerObj.prototype.remove = function(){
	$(this.element).remove();
}
oT.playerObj.prototype.pause = function(){
	var playPauseButton = $('.play-pause');
	playPauseButton.removeClass('playing');
	if(this.format === 'youtube') {
		this._ytEl.pauseVideo();
	} else {
		this.element.pause();
	}
	this.paused = true;
}
oT.playerObj.prototype.play = function(){
	var playPauseButton = $('.play-pause');
	this.skip('backwards');
	playPauseButton.addClass('playing');
	if(this.format === 'youtube') {
		this._ytEl.playVideo();
	} else {
		this.element.play();
	}
	this.paused = false;
}
oT.playerObj.prototype.playPause = function(){
	if (this.paused === false){
		this.pause();
	} else {
		this.play();
	};    
}
oT.playerObj.prototype.skipTo = function(time){
	if (this.format === 'youtube') {
		this._ytEl.seekTo( time );
	} else {
	   this.element.currentTime = time;
	}    
	
};
oT.playerObj.prototype.skip = function(direction){
	var mod = 1;
	if (direction == "backwards"){
		mod = -1;
	}
	this.skipTo( this.element.currentTime + (1.5*mod) );
}
oT.playerObj.prototype.speed = function(newSpeed){
	var el = this.element;
	if (this.format === 'youtube') {
		el = this._ytEl;
	}
	var min = 0.5;
	var max = 2;
	var step = oT.media.speedIncrement || 0.25;
	var newSpeedNumber;
	var currentSpeed = this.element.playbackRate;
	if ((newSpeed == "up") && (currentSpeed < max)){
		newSpeedNumber = currentSpeed+step;
	} else if ((newSpeed == "down") && (currentSpeed > min)){
		newSpeedNumber = currentSpeed-step;
	} else if (newSpeed == "reset"){
		newSpeedNumber = 1;
	} else if (typeof newSpeed == 'number') {
		newSpeedNumber = newSpeed;
	}
	if (typeof(newSpeedNumber) != "undefined") {
	   el.playbackRate = newSpeedNumber;
		if (el.setPlaybackRate) {
			el.setPlaybackRate(newSpeedNumber);
		}
		document.getElementById('slider3').value = newSpeedNumber;        
	}
}
oT.playerObj.prototype.getTime = function(){
	return this.element.currentTime;
}
oT.playerObj.prototype.getDuration = function(){
	return this.element.duration;
}

oT.playerObj.prototype.reset = function(){
	this.speed("reset");
	$('#media').remove();
	$('#player-time').show();
	$('#player-hook').removeClass('progressor media-title media-titleprogressor').empty();
}



oT.media.reset = function(options){
	options = options || {};
	if (oT.player.reset) {
		oT.player.reset();
		oT.player = {};
	}
	if (options.input) {
		oT.input.loadPreviousFileDetails();
		oT.input.show();
	}
	if (options.callback) {
		setTimeout(function(){
			options.callback();
		},500);
	}
}

oT.media.videoWidth = function(){
	var boxOffset = document.getElementById('textbox').getBoundingClientRect().left;
	if ( boxOffset > 200 ) {
		return (boxOffset-40) + "px";
	}
}

oT.media.initAudioJS = function(){
	audiojs.events.ready(function() {
	  audiojs.createAll();
	});
}

oT.media.disableSpeed = function(){
	$('.speed-box').html('This media only supports 1x playback rate. Sorry.');
	oT.media.speed = function(){
		return false;
	}
};

oT.playerObj.prototype._youtubeReady = function(){
	var that = this;

	var videoId = oT.media.ytParse(this.file);
	this._ytEl = new YT.Player('media', {
		width: '100%',
		videoId: videoId,
		playerVars: {
			// controls: 0,
			disablekb: 1,
			fs: 0,
			rel: 0,
			modestbranding: 1
		},
		events: {
			'onReady': this._youtubeReadyPartTwo.bind(this),
			'onStateChange': updatePause
		}
	});
	
	this._setYoutubeTitle(videoId);
		
	setInterval(function(){
		that.element.currentTime = that._ytEl.getCurrentTime();
	},200);
		
	// YouTube embeds can't do 0.25 increments
	$('#slider3').attr('step',0.5);
	oT.media.speedIncrement = 0.5;
	
	function updatePause (ev){
		var status = ev.data;
		if (status === 2) {
			this.paused = true;
		} else {
			this.paused = false;
		}
	}
	
}

oT.playerObj.prototype._youtubeReadyPartTwo = function(){
	// fix non-responsive keyboard shortcuts bug
	$('#slider3').val(0.5).change().val(1).change();
	
	// Some YouTube embeds only support normal speed
	if (this._ytEl.getAvailablePlaybackRates()[0] === 1) {
		oT.media.disableSpeed();
	}
	
	this.element.duration = this._ytEl.getDuration()

	var that = this;
	
	setTimeout(function(){
		// kickstart youtube
		this.play();
		setTimeout(function(){
			that.pause();
			if (oT.media.startPoint) {
				setTimeout(function(){
					that.seekTo( oT.media.startPoint );
				},500);
			}
		},500);
		
	},1000);

}


oT.playerObj.prototype._buildYoutube = function(url){
	this.url = url;
	
	this.element = document.createElement('div');
	this.element.setAttribute('id','media');
	document.body.appendChild(this.element); 
		
	setInterval(function(){
		var $ifr = $('iframe#media');
		$ifr.width(oT.media.videoWidth); 
		$ifr.height( $ifr.width() * (3/4) );
	},500);
	
	// import YouTube API
	if ( $('#youtube-script').length === 0) {
		var tag = document.createElement('script');
		tag.setAttribute('id','youtube-script');
		tag.src = "https://www.youtube.com/iframe_api";
		var firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	} else {
		this._youtubeReady(this);
	}
	window.onYouTubeIframeAPIReady = this._youtubeReady.bind(this);        
}

oT.media.ytParse = function(url){
	if (url.match) {
		var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
		var match = url.match(regExp);
		if (match&&match[2].length==11){
			return match[2];
		}
	}
	return false;
}

oT.playerObj.prototype._setYoutubeTitle = function(id){
	var url = 'http://gdata.youtube.com/feeds/api/videos/'+id+'?v=2&alt=json-in-script&callback=?';
	$.ajax({
	   type: 'GET',
		url: url,
		async: false,
		jsonpCallback: 'jsonCallback',
		contentType: "application/json",
		dataType: 'jsonp',
		success: function(d) {
			var title = '[YouTube] '+d.entry.title.$t;
			this.title = title;
			oT.input.saveFileDetails({
				name: title,
				source: 'https://www.youtube.com/watch?v='+id
			});
			$('#player-hook').html(title).addClass('media-title');
			adjustPlayerWidth();
		},
		error: function(e){
			console.log(e);
		}
	});
}


oT.input = {};
oT.input.reactToFile = function(input){
	var file = input.files[0];
	if ( checkTypeSupport( file ) === true ){
		oT.media.create( { file: file } );
		adjustPlayerWidth();
		oT.input.saveFileDetails(file.name);
	} else {
		var msg = document.webL10n.get('format-warn');
		msg = msg.replace('[file-format]',file.type.split("/")[1]);
		$('#formats').html(msg).addClass('warning');
	}
}

oT.input.askForYoutube = function(){
	$('.input').addClass('ext-input');
	
	var $form = $('.ext-input input');
	$form.focus();
	$form.keypress(function (e) {
	  if (e.which == 13) {
		oT.input.reactToYoutube( $(this).val() );
		return false;
	  }
	});
	
}

oT.input.reactToYoutube = function(url){
	if ( oT.media.ytParse(url) ){
		oT.input.processYoutube( url );
		$('.input').removeClass('ext-input');
	} else {
		var msg = document.webL10n.get('youtube-error');
		$('.ext-input-warning').text(msg).show();
	}
}

oT.input.returnToNormal = function(){
	$('.input').removeClass('ext-input');
}

oT.input.processYoutube = function(url){
	oT.media.create( {file: url} );
}

oT.input.loadPreviousFileDetails = function(){
	if ( localStorage.getItem("oT-lastfile") ) {
		var lastFile = JSON.parse( localStorage.getItem("oT-lastfile") );
		var lastfileText = document.webL10n.get('last-file');
		if (lastFile.name === undefined) {
			document.getElementById("lastfile").innerHTML = lastfileText+' '+lastFile;
		} else if (lastFile.source === '') {
			document.getElementById("lastfile").innerHTML = lastfileText+' '+lastFile.name;
		} else {
			var el = document.getElementById("lastfile");
			el.innerHTML = lastfileText+' <span class="media-reload">'+lastFile.name+'</span>';
			el.addEventListener('click',function(){ 
				oT.input.processYoutube( lastFile.source );
			});
		}
	}    
}

oT.input.saveFileDetails = function(fileDetails){
	var obj = fileDetails;
	if (typeof file === 'string') {
		obj = {
			name: fileDetails,
			source: ''
		}
	}
	localStorage.setItem("oT-lastfile", JSON.stringify( obj ));
}

oT.input.dragListener = function(){
	var button = $('.file-input-wrapper')[0];
	button.addEventListener('dragover', function(){
		$('.file-input-wrapper').addClass('hover');
	}, false);
	button.addEventListener('dragleave', function(){
		$('.file-input-wrapper').removeClass('hover');
	}, false);
	
}

oT.input.show = function(){
	$('.topbar').addClass('inputting');
	$('.input').addClass('active');
	$('.sbutton.time').removeClass('active');
	$('.text-panel').removeClass('editing');
	
}


oT.input.hide = function(){
	$('.topbar').removeClass('inputting');
	$('.input').removeClass('active');
	$('.sbutton.time').addClass('active');
	$('.text-panel').addClass('editing');
};

oT.message = {}

oT.message.header = function(msg){
	$('.message-panel .message-content').html( msg );
	$('.message-panel').removeClass('hidden');
}

oT.message.close = function(){
	$('.message-panel').addClass('hidden');
}


oT.import = {}

oT.import.loadFile = function( file ){
	
	try {
		file = JSON.parse(file);    
		oT.import.replaceTranscriptTextWith(file.text);
		oT.import.remindOfMediaFile(file.media, file['media-source'], file['media-time']);
	} catch (e) {
		alert('这不是一个 .OTR 格式的文件！');
	}
}

oT.import.replaceTranscriptTextWith = function( newText ){
	
	// TODO: CLEAN STRING
	newText = oT.import.clean(newText);
	
	var $textbox = $("#textbox");
	
	$textbox.fadeOut(300,function(){
		if (typeof newText === 'string') {
			$textbox[0].innerHTML = newText;
		} else {
			textbox[0].innerHTML = '';
			$textbox[0].appendChild(newText);    
		}
		oT.timestamp.activate();
		$('.textbox-container').scrollTop(0)
		$(this).fadeIn(300);
	});
	
}

oT.import.remindOfMediaFile = function( filename, filesource, filetime ){
	if (filename && filename !== '') {
		// var lastfileText = document.webL10n.get('last-file');
		var lastfileText = 'File last used with imported document:';
		var restoreText = 'Restore';
		if ((filesource) && (oT.media.ytParse(filesource))) {
			oT.message.header( lastfileText+' <a href="#" id="restore-media">'+filename+'</a>' );
			$('#restore-media').click(function(){
				oT.media.create({file: filesource, startpoint: filetime});
				return false;
			});
		} else {
			oT.message.header(lastfileText+' '+filename);
		}
	}
}

oT.import.localButtonReaction = function( input ){
	var file = input.files[0];
	
	var reader = new FileReader();
	reader.readAsText(file);
	reader.onload = function(e) { 
		var contents = e.target.result;
		oT.import.loadFile( contents );
	}
	
	input.value = '';
	
	
}

oT.import.clean = function(text){
	
	text = oT.texteditor.clean(text);
	
	return text;
}

/******************************************
			   Text editor
******************************************/

oT.texteditor = {}

oT.texteditor.clean = function( html ){
	var result = $.htmlClean(html, {
		format: false,
		allowedTags: ['p', 'div', 'strong', 'em', 'i', 'b', 'span', 'br'],
		allowedAttributes: [['class',['span']],['data-timestamp',['span']]],
		allowedClasses: ['timestamp']
	});
	return result;
}


function adjustPlayerWidth(){
	var cntrls = $('.controls');
	
	var gap = $(window).width() - (cntrls.width() + $('.title').outerWidth()  + $('.help-title').outerWidth() + $('.language-title').outerWidth()  );
	$('#player-hook').width( $('#player-hook').width()+gap -15 );
}


function toggleAbout(){
	$('.help-title').removeClass('active');
	$('.help').removeClass('active');
	$('.title').toggleClass('active');
	$('.about').toggleClass('active');
}

function toggleHelp(){
	$('.title').removeClass('active');
	$('.about').removeClass('active');
	$('.help-title').toggleClass('active');
	$('.help').toggleClass('active');
}


function adjustEditorHeight(){
	$('.textbox-container').height( window.innerHeight - 38 );
}

function placeTextPanel(){
   var position = parseInt( $('#textbox').offset().left, 10) + 700;
   $('.text-panel').css('left', position);
}

function countWords(str){
	var trimmedStr = $.trim(str);
	if (trimmedStr){
		return trimmedStr.match(/\S+/gi).length;
	}
	return 0;
}

function countTextbox(){
	var textboxElement = document.getElementById('textbox');
	var textboxText = textboxElement.innerText || textboxElement.textContent;
	var count = countWords(textboxText);
 
	document.getElementById('wc').innerHTML = count;
	
	var wordcountText = document.webL10n.get('wordcount', {n: count});
	document.querySelector('.wc-text').innerHTML = wordcountText;
}

function initWordCount(){
	setInterval(function(){
		countTextbox();
	}, 1000);
	
}


function watchFormatting(){
	var b = document.queryCommandState("Bold");
	var bi = document.getElementById("icon-b");
	var i = document.queryCommandState("italic");
	var ii = document.getElementById("icon-i");
	
	if (b === true){
		bi.className = "fa fa-bold active"
	} else {
		bi.className = "fa fa-bold"
	}
	if (i === true){
		ii.className = "fa fa-italic active"
	} else {
		ii.className = "fa fa-italic"
	}
}

function initWatchFormatting(){
	setInterval(function(){
		watchFormatting();
	}, 100);
}




/******************************************
				Other
******************************************/


function detectFormats(format){
	var a = document.createElement('audio');
	return !!(a.canPlayType && a.canPlayType('audio/'+format+';').replace(/no/, ''));
}

function detectVideoFormats(format){
	var a = document.createElement('audio');
	return !!(a.canPlayType && a.canPlayType('audio/'+format+';').replace(/no/, ''));
}

function listSupportedFormats(type){
	if (type == "audio") {
		var formats = ['mp3', 'ogg', 'webm', 'wav'];        
	} else if (type == "video"){
		var formats = ['mp4', 'ogg', 'webm'];
	}
	var supportedFormats = [];
	var i = 0;
	formats.forEach(function(format, index) {
		if (detectFormats(format) == true){
			supportedFormats[i] = format;
			i++;
		}
	});
	return supportedFormats.join('/');
}

function listSupportedVideoFormats(){
	var supportedFormats = [];
	var formats = ['mp4', 'ogg', 'webm'];
	var i = 0;
	formats.forEach(function(format, index) {
		if (detectVideoFormats(format) == true){
			supportedFormats[i] = format;
			addAndToEnd(i, supportedFormats);
			i++;
		}
	});
	return supportedFormats.join(', ');
}

function checkTypeSupport(file){
	var fileType = file.type.split("/")[0];
	var a = document.createElement(fileType);
	return !!(a.canPlayType && a.canPlayType(file.type).replace(/no/, ''));
}

function setFormatsMessage(){
	var text = document.webL10n.get('formats');
	text = text.replace("[xxx]",listSupportedFormats("audio"));
	text = text.replace("[yyy]",listSupportedFormats("video"));
	document.getElementById("formats").innerHTML = text;
}

function setStartButton(){
	var startText = document.webL10n.get('start-ready');
	$('.start').text(startText).addClass('ready');
}

function html5Support(){
	var audioTagSupport = !!(document.createElement('audio').canPlayType);
	var contentEditableSupport = document.getElementById('textbox').contentEditable;
	var fileApiSupport = !!(window.FileReader);

	if (audioTagSupport && contentEditableSupport && fileApiSupport){
		return true;
	} else {
		return false;
	}
}

function oldBrowserCheck(){
	if ( html5Support() === false ){
		var oldBrowserWarning = document.webL10n.get('old-browser-warning');
		document.getElementById('old-browser').innerHTML = oldBrowserWarning;
	}
}

function chromeOsCheck(){
	var ua = window.navigator.userAgent;
	if ( ua.indexOf("CrOS") > -1 ) {
		
		Mousetrap.bind('ctrl+1', function(e) {
			pd(e);
			oT.player.skip('backwards');
			return false;
		});
		Mousetrap.bind('ctrl+2', function(e) {
			pd(e);
			oT.player.skip('forwards');
			return false;
		});
		Mousetrap.bind('ctrl+3', function(e) {
			pd(e);
			oT.player.speed('down');
			return false;
		});
		Mousetrap.bind('ctrl+4', function(e) {
			pd(e);
			oT.player.speed('up');
			return false;
		});
	}
}

oT.backup = {};

oT.backup.openPanel = function(){
	oT.backup.populatePanel();
	$('.backup-window').height( $('.textbox-container').height() * (3/5) );
	$('.backup-panel').fadeIn('fast');
}

oT.backup.closePanel = function(){
	$('.backup-panel').fadeOut('fast',function(){
		$('.backup-window').empty();
		
	});
}

oT.backup.generateBlock = function(ref){
	// create icon and 'restore' button
	var text = localStorage.getItem(ref);
	var timestamp = ref.replace('oTranscribe-backup-','');
	var date = oT.backup.formatDate(timestamp);
	
	var block = document.createElement('div');
	var doc = document.createElement('div');
	var restoreButton = document.createElement('div');

	block.className = 'backup-block';
	doc.className = 'backup-doc';
	restoreButton.className = 'backup-restore-button';

	doc.innerHTML = text;
	var restoreText = document.webL10n.get('restore-button');
	restoreButton.innerHTML = date+' - <span onClick="oT.backup.restore('+timestamp+');">' +restoreText+ '</span>';
	block.appendChild(doc);
	block.appendChild(restoreButton);
	
	return block;
}

oT.backup.formatDate = function(timestamp){
	var d = new Date( parseFloat(timestamp) );
	var day =  d.getDate() + '/' + (d.getMonth()+1);
	var now = new Date();
	today = now.getDate() + '/' + (now.getMonth()+1);
	yesterday = (now.getDate()-1) + '/' + (now.getMonth()+1);
	if (day === today) {
		day = document.webL10n.get('today');
	} else if (day === yesterday) {
		day = document.webL10n.get('yesterday');
	}
	var time = d.getHours() + ':';
	if (d.getMinutes() < 10) {
		time += '0';        
	}
	time += d.getMinutes();
	
	formattedDate = day + ' ' + time;
	return formattedDate;
}

oT.backup.populatePanel = function(){
	oT.backup.addDocsToPanel(0,8);
	if (oT.backup.list().length === 0) {
		var noBackupsText = document.webL10n.get('no-backups');
		$('.backup-window').append( '<div class="no-backups">'+noBackupsText+'</div>' );
	}
}

oT.backup.addDocsToPanel = function(start,end){
	$('.more-backups').remove();
	var allDocs = oT.backup.list();
	docs = allDocs.slice(start,end);
	for (var i = 0; i < docs.length; i++) {
		$('.backup-window').append( oT.backup.generateBlock(docs[i]) );
	}
	if (allDocs[end]) {
		var loadMoreText = document.webL10n.get('more-backups');
		$('.backup-window').append( '<div class="more-backups" onclick="oT.backup.addDocsToPanel('+(end)+','+(end+8)+')" >'+loadMoreText+'</div>' );
	}
}

oT.backup.save = function(){
	// save current text to timestamped localStorage item
	var text = document.getElementById("textbox");
	var timestamp = new Date().getTime();
	oT.backup.saveToLocalStorage('oTranscribe-backup-'+timestamp, text.innerHTML);
	// and bleep icon
	$('.sbutton.backup').addClass('flash');
	setTimeout(function(){
		$('.sbutton.backup').removeClass('flash');
	},1000);
	// and add to tray
	var newBlock = oT.backup.generateBlock('oTranscribe-backup-'+timestamp);
	newBlock.className += ' new-block';
	$('.backup-window').prepend( newBlock );
	$( newBlock ).animate({
		'opacity': 1,
		'width': '25%'
	},'slow',function(){
		$( newBlock ).find('.backup-restore-button').fadeIn();
	});
	
}

oT.backup.saveToLocalStorage = function(key,value){
	try {
	   localStorage.setItem( key, value );
	} catch (e) {
	   if (e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
		   oT.backup.removeOldest();
		   oT.backup.save();
	   }
	}
	
}

oT.backup.init = function(){
	setInterval(function(){
		oT.backup.save();
		oT.backup.cleanup();
	},300000 /* 5 minutes */);
}

oT.backup.list = function(){
	var result = [];
	for (var i = 0; i < localStorage.length; i++) {
		if (localStorage.key(i).indexOf('oTranscribe-backup') > -1) {
			result.push(localStorage.key(i));
		}
	}
	return result.sort().reverse();
}


oT.backup.restore = function(timestamp){
	oT.backup.save();
	var newText = localStorage.getItem('oTranscribe-backup-'+timestamp);
	oT.import.replaceTranscriptTextWith(newText);
	oT.backup.closePanel();
}

oT.backup.cleanup = function(){
	var backups = oT.backup.list();
	for (var i = 0; i < backups.length; i++) {
		var bu = backups[i];
		var ts = bu.replace('oTranscribe-backup-','');
		var date = new Date( parseFloat( ts ) );
		var diff = Date.now() - date;
		// 1 day = 86400000 miliseconds
		if (diff > (86400000*7) ) {
			localStorage.removeItem( bu );
		}
	}
}

oT.backup.removeOldest = function(){

	var list = oT.backup.list();
	var toDelete = list.slice(Math.max(list.length - 5, 1));
	for (var i = 0; i < toDelete.length; i++) {
		localStorage.removeItem( toDelete[i] );
		localStorage.clear( toDelete[i] );
	}
}

// original autosave function
function saveText(){
	var field = document.getElementById("textbox");
	// load existing autosave (if present)
	if ( localStorage.getItem("autosave")) {        
	   field.innerHTML = localStorage.getItem("autosave");
	}
	// autosave every second - but wait five seconds before kicking in
	setTimeout(function(){
		// prevent l10n from replacing user text
		$('#textbox p[data-l10n-id]').attr('data-l10n-id','');
		setInterval(function(){
		   oT.backup.saveToLocalStorage("autosave", field.innerHTML);
		}, 1000);
	}, 5000);
}

/******************************************
			 Initialisation
******************************************/


function init(){
	saveText();
	oT.backup.init();
	adjustEditorHeight();
	placeTextPanel();
	oT.input.dragListener();
	initWordCount();
	initWatchFormatting();
	oT.timestamp.activate();
	chromeOsCheck();
	gd.loadGoogleApiAsync();
}

window.addEventListener('localized', function() {
	setFormatsMessage();
	setStartButton();
	oldBrowserCheck();
	oT.input.loadPreviousFileDetails();
	$('#curr-lang').text( oT.lang.langs[document.webL10n.getLanguage()] );
}, false);


$(document).ready(function(){
	init();
	oT.lang.bide();
	if ( localStorage.getItem("lastfile") ) {
		toggleAbout();
	}
});

$(window).resize(function() {
	adjustEditorHeight();
	adjustPlayerWidth();
	placeTextPanel();
	if (document.getElementById('media') ) {
		document.getElementById('media').style.width = oT.media.videoWidth();
	}
});




var gd = {
	CLIENT_ID : '219206830455.apps.googleusercontent.com',
	SCOPES : 'https://www.googleapis.com/auth/drive'
}


// Called during startup to prevent blocking
gd.loadGoogleApiAsync = function(){
	//var script = document.createElement("script");
	//script.type = "text/javascript";
	//script.src = "https://apis.google.com/js/client.js?onload=gd.handleClientLoad";
	//document.body.appendChild(script);
}


/**
 * Called when the client library is loaded to start the auth flow.
 */
gd.handleClientLoad = function() {
  window.setTimeout(gd.checkAuth, 1);
}

/**
 * Check if the current user has authorized the application.
 */
gd.checkAuth = function() {
	try {
		gapi.auth.authorize(
			{'client_id': gd.CLIENT_ID, 'scope': gd.SCOPES, 'immediate': true},
			gd.handleAuthResult);
	} catch(e) {
		$('.export-block-gd').css({
			'opacity': 0.5,
			'pointer-events': 'none'
		});
	}
}

/**
 * Called when authorization server replies.
 *
 * @param {Object} authResult Authorization result.
 */
gd.handleAuthResult = function(authResult) {
  if (authResult && !authResult.error) {
	// Access token has been successfully retrieved, requests can be sent to the API.
	gd.updateButton("Google Drive",true,"javascript:insertFile();");
  } else {
	// No access token could be retrieved, show the button to start the authorization flow.
	document.getElementById('x-gd-sign').onclick = function() {
		gapi.auth.authorize(
			{'client_id': gd.CLIENT_ID, 'scope': gd.SCOPES, 'immediate': false},
			gd.handleAuthResult);
	};
  }
}

gd.updateButton = function(status, active, link){
	var exportBlockGd = $('.export-block-gd');
	exportBlockGd[0].innerHTML = status;
	if (active == true){
		exportBlockGd.addClass('gd-authenticated').removeClass("unauth");  
	} else if (active == false){
		exportBlockGd.removeClass('gd-authenticated');
	}
	exportBlockGd[0].href = link;
}

gd.button = function(){
	var signIn = document.webL10n.get('sign-in');
	var text = '<a class="export-block-gd unauth" id="x-gd" target="_blank" href="javascript:void(0);">Google Drive<div class="sign-in" id="x-gd-sign">'
	+ signIn +
	'</div></a>'
	return text;
}

function uploadFile(evt) {
  gapi.client.load('drive', 'v2', function() {
	var file = evt.target.files[0];
	insertFile(file);
  });
}

/**
 * Insert new file.
 *
 * @param {File} fileData File object to read data from.
 * @param {Function} callback Function to call when the request is complete.
 */
window.insertFile = function(callback) {
	var sendingText = document.webL10n.get('send-drive');
	gd.updateButton(sendingText,false);

  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  var reader = exportText.reader();
  reader.onload = function(e) {
	var contentType = 'text/html';
	var metadata = {
	  'title': exportText.name(),
	  'mimeType': 'text/html'
	};

	var base64Data = btoa(reader.result);
	var multipartRequestBody =
		delimiter +
		'Content-Type: application/json\r\n\r\n' +
		JSON.stringify(metadata) +
		delimiter +
		'Content-Type: ' + contentType + '\r\n' +
		'Content-Transfer-Encoding: base64\r\n' +
		'\r\n' +
		base64Data +
		close_delim;

	var request = gapi.client.request({
		'path': '/upload/drive/v2/files',
		'method': 'POST',
		'params': {'uploadType': 'multipart','convert':true},
		'headers': {
		  'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
		},
		'body': multipartRequestBody});
	if (!callback) {
	  callback = function(file) {
		  var openText = document.webL10n.get('open-drive');
		gd.updateButton(openText + ' &rarr;', true, file.alternateLink);
	  };
	}
	request.execute(callback);
  }
}
/******************************************
				 Export
******************************************/

oT.export = {};

oT.export.asFormat = function( format ){
	if (format === 'md') {
		var p = document.getElementById('textbox').innerHTML;
		var clean = $.htmlClean(p, {format:true, removeTags: ["div", "span", "img", "pre", "text"]});
		var x = toMarkdown( clean );   
		return x.replace(/\t/gm,"");           
	} else if (format === 'txt') {
		var p = document.getElementById('textbox').innerHTML;
		var clean = $.htmlClean(p, {format:true, removeTags:["div", "span", "img", "em", "strong", "p", "pre", "text"]});
		return clean.replace(/\t/gm,"");
	} else if (format === 'html') {
		var p = document.getElementById('textbox').innerHTML;
		return p.replace('\n','');
	}
}

oT.export.placeButton = function ( format ){
	if (format === 'otr') {
		var doc = oT.export.createJsonFile();
		var a = document.getElementById('x-otr');
		a.download = exportText.name() + ".otr";
		a.href = "data:text/plain;base64," + exportText.utf8_to_b64( doc );
	}
}

var exportText = {
	utf8_to_b64 : function( str ) {
		return window.btoa(unescape(encodeURIComponent( str )));
	},
	// element choose element to append button to
	mdButton : function(element) {
		var md = oT.export.asFormat('md');
		var a = document.getElementById('x-md');
		a.download = exportText.name() + ".md";
		a.href = "data:text/plain;base64," + exportText.utf8_to_b64( md );
	},
	txtButton : function(element) {
		var txt = oT.export.asFormat('txt');
		var a = document.getElementById('x-txt');
		a.download = exportText.name() + ".txt";
		a.href = "data:text/plain;base64," + exportText.utf8_to_b64( txt );
	},
	name : function(){
		var d = new Date();
		var fileName = document.webL10n.get('file-name');
		return fileName + " " + d.toUTCString();
	}
}


function placeExportPanel(){
	exportText.mdButton();
	exportText.txtButton();
	oT.export.placeButton('otr');
	gd.handleClientLoad();
		
	var origin = $('#icon-exp').offset();
	var right = parseInt( $('body').width() - origin.left + 25 );
	var top = parseInt( origin.top ) - 50;
	$('.export-panel')
		.css({'right': right,'top': top})
		.addClass('active'); 
}

function hideExportPanel(){
	$('.export-panel').removeClass('active');
	$('.export-block-gd')[0].outerHTML = gd.button();
}

exportText.createBlob = function(){
	var p = document.getElementById('textbox').innerHTML;
	var aFileParts = [p];
	var oBlob = new Blob(aFileParts, {type : 'text/html'}); // the blob
	return oBlob;
}

exportText.reader= function(){
	var reader = new FileReader();
	var blob = exportText.createBlob();
	reader.readAsBinaryString(blob);
	return reader;
}


oT.export.createJsonFile = function(){
	var result = {};
	result.text = oT.export.asFormat('html');
	if (oT.player !== null){
		result.media = oT.player.title;
		if (oT.player.getTime) {
			result['media-time'] = oT.player.getTime();
		}
		if (oT.media.ytEl) {
			result['media-source'] = oT.media._ytEl.getVideoUrl();
		} else {
			result['media-source'] = '';
		}
	} else {
		result.media = '';
		result['media-source'] = '';
		result['media-time'] = '';
	}
	return JSON.stringify(result);
};

oT.lang = {};

oT.lang.langs = {
	'en': 'English',
	'pirate': 'Pirate',
	'es': 'Español',
	'de': 'Deutsch',
	'fr': 'Français',
	'nl': 'Nederlands',
	'pl': 'Polski',
	'zh-hant': '繁體中文',
	'zh-hans': '简体中文',
	'ja': '日本語',
	'pt': 'Português',
	'ca': 'Català',
	'it': 'Italiano',
	'da': 'Dansk',
	'id': 'Indonesia'
}

oT.lang.setLang = function(lang){
	if (lang){
		localStorage.setItem('oTranscribe-language',lang);
		window.location.reload();
	}
}

oT.lang.applyLang = function(callback){
	var lang = localStorage.getItem('oTranscribe-language');
	if(lang) {
		document.webL10n.setLanguage(lang);
	} else {
		document.webL10n.setLanguage('zh-hans');
	}
}

oT.lang.togglePanel = function(){
	$('.language-picker').toggleClass('active');
	$('.language-title').toggleClass('active');
}

oT.lang.bide = function(){
	if (document.webL10n.getReadyState() === 'complete' ) {
		oT.lang.applyLang();
	} else {
		setTimeout(function(){
			oT.lang.bide();
		},50);
	}
}

window.oT.lang = oT.lang;
/******************************************
			 User Interaction
******************************************/

	// keyboard shortcuts
	function pd(e){
		if (e.preventDefault) {
			e.preventDefault();
		} else {
			// internet explorer
			e.returnValue = false;
		}
	}

	Mousetrap.bind('escape', function(e) {
		pd(e);
		oT.player.playPause();
		return false;
	});
	Mousetrap.bind('f1', function(e) {
		pd(e);
		oT.player.skip('backwards');
		return false;
	});
	Mousetrap.bind('f2', function(e) {
		pd(e);
		oT.player.skip('forwards');
		return false;
	});
	Mousetrap.bind('f3', function(e) {
		pd(e);
		oT.player.speed('down');
		return false;
	});
	Mousetrap.bind('f4', function(e) {
		pd(e);
		oT.player.speed('up');
		return false;
	});
	Mousetrap.bind('mod+j', function(e) {
		pd(e);
		oT.timestamp.insert();
		return false;
	});
	Mousetrap.bind('mod+s', function(e) {
		pd(e);
		oT.backup.save();
		return false;
	});

	Mousetrap.bind('mod+b', function(e) {
		pd(e);
		document.execCommand('bold',false,null);
		return false;
	});

	Mousetrap.bind('mod+i', function(e) {
		pd(e);
		document.execCommand('italic',false,null);
		return false;
	});


	$('.play-pause').click(function(){
		oT.player.playPause();    
	});

	$('.skip-backwards').click(function(){
		oT.player.skip('backwards');    
	});
	$('.skip-forwards').click(function(){
		oT.player.skip('forwards');    
	});
	$('.button.reset').click(function(){
		oT.media.reset({input: true});    
	});

	$( ".speed" ).click(function() {
		if ($('.speed-box').not(':hover').length) {
			$(this).toggleClass('fixed');
		}    
	});

	$( "#slider3" ).change(function() {
	  oT.player.speed(this.valueAsNumber);
	});    
	
	$('.title').click(function(){
		toggleAbout();
	});
	
	$('.language-title').click(function(){
		oT.lang.togglePanel();
	});
	
	$('.language-button').click(function(){
	   oT.lang.setLang( $(this).data('language') ); 
	});

	$('.about .start').click(function(){
		if ( $(this).hasClass('ready') ) {
			toggleAbout();
		}
	});
	
	$('#attach').change(function() {
		oT.input.reactToFile(this);
	});    

	$('#local-file-import').change(function() {
		oT.import.localButtonReaction(this);
	});        
	
	$('.yt-input').click(function(){
		oT.input.askForYoutube();
	})
	
	$('.close-ext-input').click(function(){
		oT.input.returnToNormal();
	});

	$('.sbutton.export').click(function() {
		placeExportPanel();
	});    
	
	$('.sbutton.backup').click(function(){
		oT.backup.openPanel();
	});
		
	$('.backup-close').click(function(){
		oT.backup.closePanel();
	});
	
	$('.textbox-container').click(function(e) {
		if(
			$(e.target).is('#icon-exp') ||
			$(e.target).is('.export-panel') ||
			$(e.target).is('.sbutton.export')
		){
			e.preventDefault();
			return;
		}
		hideExportPanel();
	});    
	
	$(".export-panel").click(function(e) {
		 e.stopPropagation();
	});
	
	$('.close-message-panel').click(function(){
		oT.message.close();
	})
	

// End UI



})(); // end script



/******************************************
			   Timestamp
******************************************/


oT.timestamp = {
	split: function(hms){
		var a = hms.split(':');
		var seconds = (+a[0]) * 60 + (+a[1]); 
		return seconds;
	},
	get: function(){
		// get timestap
		if (!oT.player || !oT.player.getTime) {
			return false;
		}
		var time = oT.player.getTime();
		var minutes = Math.floor(time / 60);
		var seconds = ("0" + Math.floor( time - minutes * 60 ) ).slice(-2);
		return minutes+":"+seconds;
	},
	insert: function(){
		var time = oT.timestamp.get();
		if (time) {
			document.execCommand('insertHTML',false,
			'<span class="timestamp" contenteditable="false" data-timestamp="' + oT.timestamp.get() + '" >' + oT.timestamp.get() + '</span>&nbsp;'
			);
			oT.timestamp.activate();
		}
	},
	activate: function(){
		$('.timestamp').each(function( index ) {
			$( this )[0].contentEditable = false;
			$( this ).off().click(function(){
				var time = $( this ).attr('data-timestamp') || $(this).text();
				oT.player.skipTo( oT.timestamp.split(time) );
			})
		});
	}
}

// backwards compatibility, as old timestamps use setFromTimestamp() and ts.setFrom()
function setFromTimestamp(clickts, element){
	ts.setFrom(clickts, element);
}
var ts = {
	setFrom: function(clickts, element){
		if (element.childNodes.length == 1) {
			oT.player.skipTo( oT.timestamp.split(clickts) );
		}
	}
}



