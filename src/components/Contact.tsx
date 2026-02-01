import { useState } from 'react';
import emailjs from 'emailjs-com';
import plane from '/images/planeIcon.svg';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    emailjs.sendForm('service_cxyb1s5', 'template_oylvcbn', e.target as HTMLFormElement, 'CBZDxMNtzcxxOowCO')
      .then((result: any) => {
        console.log(result.text);
        setSubmitted(true);
      }, (error: any) => {
        console.log(error.text);
        alert('Error: ' + error.text);
      });
  };

  return (
    <section id="Contact" className="contact">

      <section className="emailOptionsWrapper">
        {submitted ? (
          <p className='thankYouText'>Thanks for your message! I'll get back to you soon.</p>
        ) : (
          <form className='emailOptionsWrapper' onSubmit={handleSubmit}>
            <FormField id='name' elementName='name' placeholderText='Your Name/Artist Name' elementValue={formData.name} onChangeFunc={handleChange} />
            <FormField id='email' elementName='email' placeholderText='Your Email Address' elementValue={formData.email} onChangeFunc={handleChange} elementType="email" />
            <FormField id='message' elementName='message' placeholderText='A little bit about yourself. What are you about? What is your album about? Keep it concise, we can discuss the details later :)' elementValue={formData.message} onChangeFunc={handleChange} />

            <div className="buttonWrapper">
              <button className="messageSubmitButton" type="submit">Submit</button>
            </div>
          </form>
        )}
      </section>
    </section>
  );
};

interface FormFieldProps {
  id: string;
  elementName: string;
  placeholderText: string;
  elementValue: string;
  onChangeFunc: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  elementType?: string;
}

const FormField = ({ id, elementName, placeholderText, elementValue, onChangeFunc, elementType = 'text' }: FormFieldProps) => {
  const isMessageField = (id === 'message');

  return (
    <>
      {isMessageField ? (
        <div className='userMessageContainer'>
          <textarea className='formInput' id={id} name={elementName} placeholder={placeholderText} value={elementValue} onChange={onChangeFunc} required />
        </div>
      ) : (
        <div className='userEmailContainer'>
          <input className='formInput' id={id} name={elementName} placeholder={placeholderText} value={elementValue} onChange={onChangeFunc} type={elementType} required />
        </div>
      )}
    </>
  );
};

export default Contact;
