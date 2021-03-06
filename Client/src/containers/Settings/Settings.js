import React from 'react';
import { faSave, faMinus, faCopy, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../components/UI/Button/Button';
import Input from '../../components/UI/Input/Input';
import { connect } from 'react-redux';
import { postCredentialAsync, deleteImageAsync } from '../../httpClient';
import Spinner from '../../components/UI/Spinner/Spinner';
import { toast } from 'react-toastify';
import Panel from './../../components/UI/Panel/Panel';
import Auxiliary from '../../hoc/Auxiliary/Auxiliary';
import { getImagesAsync } from './../../httpClient';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import * as actions from '../../store/actions/index';

class Settings extends React.Component {
    state = {
        controls: {
            login: {
                name: 'login',
                elementType: 'input',
                elementConfig: {
                    type: 'input',
                    placeholder: 'Enter new login. Minimum length is 6 characters.'
                },
                value: '',
                validation: {
                    minLength: 6
                },
                valid: true,
                touched: false
            },
            password: {
                name: 'password',
                elementType: 'input',
                elementConfig: {
                    type: 'password',
                    placeholder: 'Enter new password. Minimum length is 6 characters.'
                },
                value: '',
                validation: {
                    minLength: 6
                },
                valid: true,
                touched: false
            },
            token: {
                name: 'token',
                elementType: 'input',
                elementConfig: {
                    type: 'input',
                    placeholder: 'Enter new secret text (used for authorization). Minimum text length is 64 characters.'
                },
                value: '',
                validation: {
                    minLength: 64
                },
                valid: true,
                touched: false
            }
        },
        formIsValid: false,
        loading: false,
        images: []
    }

    componentDidMount() {
        if (!this.props.isAuthenticated) {
            this.props.history.push('/');
        } else {
            getImagesAsync(this.props.token).then(data => {
                this.setState({ images: data });
            });
            document.title = "Settings";
        }
    }

    checkValidity(value, rules) {
        let isValid = true;

        if (!rules) {
            return true;
        }

        if (rules.required) {
            isValid = value.trim() !== '' && isValid;
        }

        if (rules.minLength) {
            isValid = value.length >= rules.minLength && isValid;
        }

        return isValid;
    }

    inputChangedHandler = (event, inputId) => {
        const updatedForm = { ...this.state.controls };
        const updatedFormElement = { ...updatedForm[inputId] };
        updatedFormElement.value = event.target.value;
        updatedFormElement.valid = this.checkValidity(updatedFormElement.value, updatedFormElement.validation);
        updatedFormElement.touched = true;
        updatedForm[inputId] = updatedFormElement;

        let formIsValid = true;
        for (let inputId in updatedForm) {
            formIsValid = updatedForm[inputId].valid && formIsValid;
        }

        this.setState({ controls: updatedForm, formIsValid: formIsValid });
    }

    clearForm = () => {
        let controls = { ...this.state.controls };

        for (let key in this.state.controls) {
            controls = {
                ...controls,
                [key]: {
                    ...this.state.controls[key],
                    value: ''
                }
            }
        }

        this.setState({ controls: controls, loading: false });
    }

    formSubmitHandler = (e) => {
        e.preventDefault();

        if (!this.state.formIsValid) {
            return;
        }

        if (!window.confirm("Are you sure?")) {
            return;
        }

        const credential = {
            login: this.state.controls.login.value,
            password: this.state.controls.password.value,
            secret: this.state.controls.token.value
        }
        this.setState({ loading: true });
        postCredentialAsync(credential, this.props.token).then(data => {
            this.clearForm();
            toast("Data updated successfully!", { type: toast.TYPE.SUCCESS });
        });
    }

    deleteImage = (id) => {
        deleteImageAsync(id, this.props.token).then(_ => {
            getImagesAsync(this.props.token).then(data => {
                this.setState({ images: data });
            });
        });
    }

    logout = (e) => {
        e.preventDefault();
        this.props.onLogout();
    }

    render() {
        if (!this.props.isAuthenticated) {
            this.props.history.push('/login');
        }

        const formElements = [];
        for (let key in this.state.controls) {
            formElements.push({
                id: key,
                config: this.state.controls[key]
            });
        }

        const images = this.state.images.map(picture => {
            return (
                <div className="FlexImg" key={picture.id}>
                    <div className="Overlap">
                        <div style={{ padding: "0" }}>
                            <Button btnType="Danger" clicked={() => this.deleteImage(picture.id)} >
                                <FontAwesomeIcon icon={faMinus} />
                            </Button>
                            <Button btnType="Secondary">
                                <CopyToClipboard text={picture.path}>
                                    <FontAwesomeIcon icon={faCopy} />
                                </CopyToClipboard>
                            </Button>
                        </div>
                    </div>
                    <img src={picture.path} alt="" />
                </div>
            );
        });

        return (
            <Auxiliary>
                <div className="Button" style={{ textAlign: "left" }}>
                    <Button btnType="Danger" clicked={this.logout}>
                        <span><FontAwesomeIcon icon={faSignOutAlt} /></span>
                        Logout
                    </Button>
                </div>
                {this.state.loading ? <Spinner /> :
                    <Panel.body>
                        <h2>Update credentials</h2>
                        <form onSubmit={this.formSubmitHandler}>
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
                    </Panel.body>}
                <Panel.body>
                    <h2>All stored images</h2>
                    <div className="FlexContainer">
                        {images}
                    </div>
                </Panel.body>
            </Auxiliary >
        )
    }
};

const mapStateToProps = state => {
    return {
        isAuthenticated: state.auth.token !== null,
        token: state.auth.token
    };
}

const mapDispatchToProps = dispatch => {
    return {
        onLogout: () => dispatch(actions.logout())
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);