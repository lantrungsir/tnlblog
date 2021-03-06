import React, {Component, Fragment} from 'react'
//styles
import './style.css'
//components
import Media from '../Media/Media.component'
import RichTextBar from './RichTextBar/RichTextBar.component'

export default class extends Component{
  render(){
    let {imgs, contents, saveData, addImageTitle, eraseImage} = this.props;
    return(
      <div className = "publish-content"> 
        <input 
          placeholder = "....post title here" type = "text"
          onChange = {e=>saveData('title', e.target.value)}
        />
        <RichTextBar/>
        <div className = "publish-text">
          <div 
            contentEditable = {true} className = "textarea"
            placeholder = "....content here"
            onBlur = {e=>this.refineContent(0, e)}
          >
          </div>
          {
            contents.map(
              (chunk, index)=>{
                if(index ===0){
                  return null;
                }
                return (
                  <Fragment key = {index}>
                    <Media 
                      image = {imgs[chunk.imageIndex]} 
                      num = {chunk.imageIndex}
                      eraseImage = {eraseImage}
                      addImageTitle = {addImageTitle}
                    />
                    <div 
                      contentEditable = {true} className = "textarea"
                      placeholder = "....continue to write here"
                      onBlur = {e=>this.refineContent(index, e)}
                    >
                    </div>
                  </Fragment>
                )
              }
            )
          }
        </div>
      </div>
    )
  }
  refineContent=(index, e)=>{
    let {saveData} = this.props;
    let inputText=  e.target.innerHTML;
    let replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    replacedText = inputText.replace(replacePattern1, 
      `<a style = 'text-decoration:underline;' href='$1'>$1</a>`
    );

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, 
      `$1<a style="text-decoration:underline;add" href="http://$2" target="_blank">$2</a>`
    );

    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, 
      `<a style='text-decoration:underline;' href='mailto:$1'>$1</a>`
    );
    saveData('contents', replacedText, index);
    let pureText = e.target.innerText || e.target.textContent;
    if(!pureText.trim().length){
      e.target.innerHTML = null;
    }
  }
}