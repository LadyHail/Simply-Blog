import React from 'react';
import Axios from '../../../axios-api';
import Button from './../../UI/Button/Button';
import Panel from './../../UI/Panel/Panel';
import Input from './../../UI/Input/Input';
import RichTextbox from '../../UI/RichTextbox/RichTextbox';
import { EditorState, convertToRaw } from 'draft-js';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class NewPost extends React.Component {
    state = {
        form: {
            title: {
                elementType: 'input',
                elementConfig: {
                    type: 'text',
                    placeholder: 'Title (required)'
                },
                value: '',
                validation: {
                    required: true
                },
                valid: false,
                touched: false
            },
            tags: {
                elementType: 'input',
                elementConfig: {
                    type: 'text',
                    placeholder: 'Use space to separate tags eg. programming c# blog',
                },
                value: '',
                valid: true,
                touched: false
            }
        },
        formIsValid: false,
        loading: false,
        editor: EditorState.createEmpty()
    }

    onEditorChange = (editorState) => {
        this.setState({ editor: editorState });
    }

    checkValidity(value, rules) {
        let isValid = true;

        if (!rules) {
            return true;
        }

        if (rules.required) {
            isValid = value.trim() !== '' && isValid;
        }

        return isValid;
    }

    inputChangedHandler = (event, inputId) => {
        const updatedForm = { ...this.state.form };
        const updatedFormElement = { ...updatedForm[inputId] };
        updatedFormElement.value = event.target.value;
        updatedFormElement.valid = this.checkValidity(updatedFormElement.value, updatedFormElement.validation);
        updatedFormElement.touched = true;
        updatedForm[inputId] = updatedFormElement;

        let formIsValid = true;
        for (let inputId in updatedForm) {
            formIsValid = updatedForm[inputId].valid && formIsValid;
        }

        this.setState({ form: updatedForm, formIsValid: formIsValid });
    }

    onFormSubmitHandler = (e) => {
        e.preventDefault();

        if (!this.state.formIsValid) {
            return;
        }

        let post = new FormData();
        const tags = this.state.form.tags.value.split(' ');

        post.append("categories", tags)
        post.append("title", this.state.form.title.value);
        post.append("image", this.refs.image.files[0]);
        let content = this.state.editor.getCurrentContent();
        content = convertToRaw(content);
        post.append("content", JSON.stringify(content));

        Axios.post('/api/blog/new', post)
            .then(() => {
                this.props.history.push('/');
            })
            .catch(err => {
                console.log(err);
            });
    }

    render() {
        const formElements = [];
        for (let key in this.state.form) {
            formElements.push({
                id: key,
                config: this.state.form[key]
            });
        }

        return (
            <Panel.body>
                <form onSubmit={this.onFormSubmitHandler}>
                    <div style={{ padding: "0.375rem 0.75rem" }}>
                        <Input type="file" name="image" ref="image" accept="image/*" className="Input" />
                    </div>
                    {formElements.map(element => (
                        <Input
                            key={element.id}
                            elementType={element.config.elementType}
                            elementConfig={element.config.elementConfig}
                            value={element.config.value}
                            changed={(event) => this.inputChangedHandler(event, element.id)}
                            shouldValidate={element.config.validation}
                            invalid={!element.config.valid}
                            touched={element.config.touched}
                            className={element.config.className} />
                    ))}
                    <RichTextbox
                        onEditorChange={this.onEditorChange}
                        editorState={this.state.editor}
                    />
                    <div className="Button">
                        <Button btnType="Success">
                            <span><FontAwesomeIcon icon={faSave} /></span>
                            Save
                        </Button>
                    </div>
                </form>
            </Panel.body>
        )
    }
}

export default NewPost;