import React from 'react';
import { postNewCommentAsync } from '../../../../httpClient';
import Button from '../../../../components/UI/Button/Button';
import Panel from '../../../../components/UI/Panel/Panel';
import Input from '../../../../components/UI/Input/Input';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Spinner from '../../../../components/UI/Spinner/Spinner';
import { toast } from 'react-toastify';

class NewComment extends React.Component {
    state = {
        commentForm: {
            name: {
                elementType: 'input',
                elementConfig: {
                    type: 'text',
                    placeholder: 'Your name (required)'
                },
                value: '',
                validation: {
                    required: true
                },
                valid: false,
                touched: false
            },
            email: {
                elementType: 'input',
                elementConfig: {
                    type: 'email',
                    placeholder: 'Your e-mail (required)'
                },
                value: '',
                validation: {
                    required: true
                },
                valid: false,
                touched: false
            },
            content: {
                elementType: 'textarea',
                elementConfig: {
                    type: 'text',
                    placeholder: 'Your text goes here (required)',
                },
                className: 'Textarea-small',
                value: '',
                validation: {
                    required: true
                },
                valid: false,
                touched: false
            }
        },
        formIsValid: false,
        loading: false
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
        const updatedCommentForm = { ...this.state.commentForm };
        const updatedFormElement = { ...updatedCommentForm[inputId] };
        updatedFormElement.value = event.target.value;
        updatedFormElement.valid = this.checkValidity(updatedFormElement.value, updatedFormElement.validation);
        updatedFormElement.touched = true;
        updatedCommentForm[inputId] = updatedFormElement;

        let formIsValid = true;
        for (let inputId in updatedCommentForm) {
            formIsValid = updatedCommentForm[inputId].valid && formIsValid;
        }

        this.setState({ commentForm: updatedCommentForm, formIsValid: formIsValid });
    }

    clearForm = () => {
        let updatedCommentForm = { ...this.state.commentForm };

        for (let key in this.state.commentForm) {
            updatedCommentForm = {
                ...updatedCommentForm,
                [key]: {
                    ...this.state.commentForm[key],
                    value: ''
                }
            }
        }

        this.setState({ commentForm: updatedCommentForm, loading: false });
    }

    onFormSubmitHandler = (e) => {
        e.preventDefault();

        if (!this.state.formIsValid) {
            return;
        }

        const comment = {
            email: this.state.commentForm.email.value,
            author: this.state.commentForm.name.value,
            content: this.state.commentForm.content.value,
            postId: this.props.id
        }

        this.setState({ loading: true });
        postNewCommentAsync(this.props.id, comment).then(data => {
            this.clearForm();
            this.props.submit();
            toast("Your comment saved successfully!", { type: toast.TYPE.SUCCESS });
        });
    }

    render() {
        const formElements = [];
        for (let key in this.state.commentForm) {
            formElements.push({
                id: key,
                config: this.state.commentForm[key]
            });
        }

        return (
            (this.state.loading ? <Spinner /> :
                <div className="M30">
                    <Panel.body>
                        <form onSubmit={this.onFormSubmitHandler}>
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

                            <div className="Button">
                                <Button btnType="Success">
                                    <span><FontAwesomeIcon icon={faSave} /></span>
                                    Save
                            </Button>
                            </div>
                        </form>
                    </Panel.body>
                </div>)
        )
    }
};

export default NewComment;