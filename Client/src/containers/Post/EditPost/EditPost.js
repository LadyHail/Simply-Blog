import React from 'react';
import { connect } from 'react-redux';
import Axios, { options } from '../../../axios-api';
import Button from '../../../components/UI/Button/Button';
import Panel from '../../../components/UI/Panel/Panel';
import Input from '../../../components/UI/Input/Input';
import Spinner from '../../../components/UI/Spinner/Spinner';
import RichTextbox from '../../../components/UI/RichTextbox/RichTextbox';
import { EditorState, convertToRaw, convertFromRaw } from 'draft-js';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';

class EditPost extends React.Component {
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
                valid: true,
                touched: false
            },
            categories: {
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
        image: '',
        formIsValid: true,
        loading: true,
        setImage: false,
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

    componentDidMount() {
        if (this.state.form.title.value === '') {
            this.setState({ loading: true });
            Axios.get('/api/blog/' + this.props.match.params.id)
                .then(response => {
                    response.data.categories = response.data.categories.join(' ');
                    this.fillForm(response.data);
                    const content = EditorState
                        .createWithContent(convertFromRaw(JSON.parse(response.data.content)));

                    this.setState({ editor: content })
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }

    fillForm = (data) => {
        let updatedForm = { ...this.state.form };

        for (let key in this.state.form) {
            updatedForm = {
                ...updatedForm,
                [key]: {
                    ...this.state.form[key],
                    value: data[key]
                }
            }
        }

        this.setState({ form: updatedForm, image: data.imageUri, loading: false });
    }

    onFormSubmitHandler = (e) => {
        e.preventDefault();

        if (!this.state.formIsValid) {
            return;
        }

        let post = new FormData();
        const tags = this.state.form.categories.value.split(' ');

        post.append("id", this.props.match.params.id);
        post.append("categories", tags);
        post.append("title", this.state.form.title.value);
        let content = this.state.editor.getCurrentContent();
        content = convertToRaw(content);
        post.append("content", JSON.stringify(content));

        if (this.state.setImage) {
            post.append("image", this.refs.image.files[0]);
        } else {
            post.append("useExistingImage", "true");
        }

        Axios.patch('/api/blog/' + this.props.match.params.id, post, options(this.props.token))
            .then(response => {
                this.props.history.push('/');
                toast("Data updated successfully!", { type: toast.TYPE.SUCCESS });
            });
    }

    setNewImage = () => {
        this.setState({ setImage: !this.state.setImage })
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
            (!this.state.loading ?
                (<Panel.body>
                    <form onSubmit={this.onFormSubmitHandler}>
                        <div style={{ padding: "0.375rem 0.75rem" }}>
                            <div style={{ marginBottom: "10px" }}>
                                <Button btnType="Secondary" type="button" clicked={this.setNewImage}>{this.state.setImage ? "Use existing image" : "Set new image"}</Button>
                                {this.state.setImage ? <input type="file" name="image" ref="image" accept="image/*" className="Input" /> : null}
                            </div>
                            {this.state.image ?
                                <div className="Img">
                                    <img src={this.state.image} alt={this.state.form.title.value} />
                                </div> : null}
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
                </Panel.body>)
                :
                <div className="Container">
                    <Spinner />
                </div>)
        )
    }
}

const mapStateToProps = state => {
    return {
        token: state.auth.token
    };
}

export default connect(mapStateToProps)(EditPost);