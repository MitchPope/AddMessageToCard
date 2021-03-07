/* 
Little Letterbox Gift Company
Script to insert customer message onto gift card and export a pritable pdf.
*/


// Choose file to open
if (isOSX())
{
    var cardFile = File.openDialog('Select a Card File', function (f) { return (f instanceof Folder) || f.name.match(/\.ai$/i);} );
} else
{
    var cardFile = File.openDialog('Select a Card File',);
}

// Choose save folder
if (isOSX())
{
    var saveFolder = Folder.selectDialog('Select a location to save the print files');
} else
{
    var saveFolder = Folder.selectDialog('Select a location to save the print files');
}

// Open in and read csv file
if (isOSX())
{
    var csvFile = File.openDialog('Select a TSV File', function (f) { return (f instanceof Folder) || f.name.match(/\.tsv$/i);} );
} else
{
    var csvFile = File.openDialog('Select a TSV File','tab-separated-values(*.tsv):*.tsv;');
}
if (csvFile != null)
{
    fileArray = readInCSV(csvFile);
}

function readInCSV(fileObj)
{
  var fileArray = new Array();
  fileObj.open('r');
  fileObj.seek(0, 0);
  var lineNum = 0;
  var lineBr = 'lineBr';
  while(!fileObj.eof)
  {
    var thisLine = fileObj.readln();
    var csvArray = thisLine;
    if (lineNum != 0 && lineNum !== ""){
      var re = /[0-9]/;
      if (csvArray.search(re) > 1 || csvArray.search(re) == -1){
        var lastIndex = fileArray.length-1;
        fileArray[lastIndex] = fileArray[lastIndex].concat(lineBr.concat(csvArray));
      } else {
        fileArray.push(csvArray);
      }
    } else {
      fileArray.push(csvArray);
    }
    lineNum++;
  }
  fileObj.close();
  return fileArray;
}

function isOSX()
{
    return $.os.match(/Macintosh/i);
}

// Main Loop //
clearLog()
for(i = 1; i < fileArray.length; i++){

    openFile(cardFile);
    
    var tsvArray = fileArray[i].split('\t');
    for(ii=0; ii<tsvArray.length; ii++){
        if (tsvArray[ii] === ""){
            tsvArray[ii] = " ";
        } else {
            var tsvArrayUnsafe = tsvArray[ii].replace(/^"(.+(?="$))"$/, '$1');
            tsvArray[ii] = tsvArrayUnsafe.replace(/lineBr/g, '\n');
            /* tsvArray[ii] = escapeXml(tsvArrayUnsafe);
            tsvArray[ii] = tsvArray[ii].replace(/['"“”‘’„”’]/g, '&#39;')  */
        }
    }

    // change file textframes
    changeText("Name", tsvArray[1]);
    changeText("Message", tsvArray[2]);
    changeText("From", tsvArray[3]);
    app.redraw();
    
    DealWithOversetText_MultiLine();
    deleteEmptyTextboxes();
    centerTextBoxes();
    SaveFilledFile(tsvArray[0]);
    app.activeDocument.close( SaveOptions.DONOTSAVECHANGES );
};

function changeText(objectName, newText){
    var doc = app.activeDocument;
    var textFrame = doc.textFrames.getByName(objectName);
    //alert(myTextFrame.toString());
    if(newText === ""){
        //textFrame.remove();
    } else {
        textFrame.contents = newText;
    };
    //myOtherTextFrame.contents = newText;
}



function openFile(path){
    myDoc = app.open(path);
};

function logErr(error){
    try{
        var logPath = saveFolder + "/logerr.txt";
        var a = new File(logPath);
        //WRITE TO LOG
        a.open('a');
        try{
            a.writeln(error);
        } catch(e) {
            alert('cant writeln')
        }
        a.close();
    } catch(e) {
        alert('error logging to logerr file' + e);
    }
    return logPath;
}

function clearLog(){
    var filePath = saveFolder + "/logerr.txt";
    var a = new File(filePath);
    //CLEAR LOG
    try{
        a.open('w');
        a.writeln("");
        a.close();
    }
    catch(e){
        
    }

}

function SaveFilledFile(setName){
    var f = new Folder(saveFolder + '/Output');

    if (!f.exists){f.create();}
    
    var targetFile = new File(saveFolder + '/Output/' + setName + '.pdf');
    pdfSaveOpts = getPDFOptions();
    app.activeDocument.saveAs(targetFile, pdfSaveOpts);
}

function getPDFOptions()
{
   var pdfSaveOpts = new PDFSaveOptions();
   pdfSaveOpts.acrobatLayers = false;
   pdfSaveOpts.colorBars = false;
   pdfSaveOpts.colorCompression = CompressionQuality.AUTOMATICJPEGHIGH;
   pdfSaveOpts.compressArt = true;
   pdfSaveOpts.embedICCProfile = true;
   pdfSaveOpts.enablePlainText = true;
   pdfSaveOpts.generateThumbnails = false;
   pdfSaveOpts.optimization = true;
   pdfSaveOpts.pageInformation = false;
   return pdfSaveOpts;
}

function DealWithOversetText_MultiLine() {
  var defaultSizeTagName = "overset_text_default_size";
  var defaultIncrement = 0.2;

  function recordFontSizeInTag(size, art){
    var tag;
    var tags = art.tags;
    try {
      tag = tags.getByName(defaultSizeTagName);
      tag.value = size;
    } catch(e) {
      tag = tags.add();
      tag.name = defaultSizeTagName;
      tag.value = size;
    }
  };

  function readFontSizeFromTag(art){
    var tag;
    var tags = art.tags;
    try {
      tag = tags.getByName(defaultSizeTagName);
      return tag.value * 1;
    } catch(e) {
      return null;
    }
  };

  function recordFontSize() {
    var doc = app.activeDocument;
    for (var i = 0; i < doc.textFrames.length; i++) {
      var t = doc.textFrames[i];
      if ((t.kind == TextType.AREATEXT || t.kind == TextType.PATHTEXT) && t.editable && !t.locked && !t.hidden) {
        // t.note = t.textRange.characterAttributes.size;
        recordFontSizeInTag(t.textRange.characterAttributes.size, t);
      }
    };
  };

  function isOverset(textBox, lineAmt) {
    if (textBox.lines.length > 0) {
      var charactersOnVisibleLines = 0;
      //alert(lineAmt);
      /* if(typeof(lineAmt) != "undefined"){
        lineAmt = 1;
      } */
      for (var i = 0; i < lineAmt; i++) {
        charactersOnVisibleLines += textBox.lines[i].characters.length;
        //alert(textBox.lines[i].contents);
        if(textBox.lines[i].contents.search(/$/) > 0){charactersOnVisibleLines++};
        //alert(charactersOnVisibleLines + " on line " + i + " so far.\n" + lineAmt + "lines in total.")
      }
      //alert(charactersOnVisibleLines +"<"+ textBox.characters.length)
      if (charactersOnVisibleLines < textBox.characters.length) {
        return true;
      } else {
        return false;
      }
    } else if (textBox.characters.length > 0) {
      return true;
    }
  };

  function lineCount(textBox){
      return textBox.lines.length;
  }

  function shrinkFont(textBox) {
    //var lineCount = textBox.lines.length;
    if (textBox.lines.length > 0) {
      if (isOverset(textBox, lineCount(textBox))) {
        var inc = defaultIncrement;
        while (isOverset(textBox, lineCount(textBox))) {
          textBox.textRange.characterAttributes.size -= inc;
        }
      }
    } else if (textBox.characters.length > 0) {
      var inc = defaultIncrement;
      while (isOverset(textBox, lineCount(textBox))) {
        textBox.textRange.characterAttributes.size -= inc;
      }
    }
  };

  function resetSize(textAreaBox) {
    var t = textAreaBox;
    if (t.contents != "") {
      // if (t.note != "") {
      //     t.textRange.characterAttributes.size = (t.note * 1);
      // }
      var size = readFontSizeFromTag(t);
      if(size != null){
        t.textRange.characterAttributes.size = size;
      }
    }
  };

  function removeTagsOnText(){
    var doc = app.activeDocument;
    for (var i = 0; i < doc.textFrames.length; i++) {
      try {
        doc.textFrames[i].tags.getByName(defaultSizeTagName).remove();
      } catch (e) {

      }
    }
  };

  function resetAllTextBoxes() {
    for (var i = 0; i < doc.textFrames.length; i++) {
      var t = doc.textFrames[i];
      if ((t.kind == TextType.AREATEXT || t.kind == TextType.PATHTEXT) && t.editable && !t.locked && !t.hidden) {
        resetSize(t);
      }
    };
  };

  function shrinkAllTextBoxes() {
    for (var i = 0; i < doc.textFrames.length; i++) {
      var t = doc.textFrames[i];
      if ((t.kind == TextType.AREATEXT || t.kind == TextType.PATHTEXT) && t.editable && !t.locked && !t.hidden) {
        shrinkFont(t);
      }
    };
  };
  if (app.documents.length > 0) {
    var doc = app.activeDocument;
    /* if (doc.dataSets.length > 0 && doc.activeDataSet == doc.dataSets[0]) {
      recordFontSize();
    }
    resetAllTextBoxes(); */
    shrinkAllTextBoxes();
    /* if (doc.dataSets.length > 0 && doc.activeDataSet == doc.dataSets[doc.dataSets.length - 1]) {
      removeTagsOnText();
    } */
  }
  return true;
};

function deleteEmptyTextboxes(){
    var doc = app.activeDocument;
    for (var i = 0; i < doc.textFrames.length; i++) {
        var t = doc.textFrames[i];
        if (t.editable && !t.locked && !t.hidden) {
            var charCount = t.characters.length;
            if (charCount == 1){
                t.locked = true;
            }
        }
    };
};

function centerTextBoxes(){
    var doc = app.activeDocument;
    for (var i = 0; i < doc.textFrames.length; i++) {
        var t = doc.textFrames[i];
        if ((t.kind == TextType.AREATEXT || t.kind == TextType.PATHTEXT) && t.editable && !t.locked && !t.hidden) {
            t.convertAreaObjectToPointObject();
        }
    };
    app.executeMenuCommand('selectall');
    app.executeMenuCommand('group');
    // Get the active Artboard index
    var activeAB = doc.artboards[doc.artboards.getActiveArtboardIndex()];

    // Get the Height of the Artboard
    var artboardBottom = activeAB.artboardRect[3];

    doc.selection[0].top = (artboardBottom/2) + (doc.selection[0].height/2);
}