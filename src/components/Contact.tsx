import { useState } from 'react';
import emailjs from 'emailjs-com';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    emailjs.sendForm(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      e.target as HTMLFormElement,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    )
      .then(() => {
        setSubmitted(true);
      }, (error: { text?: string }) => {
        alert('Error: ' + (error.text ?? 'Something went wrong sending your message.'));
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
              <button className="messageSubmitButton" type="submit">Send</button>
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
          <textarea className='formInput' id={id} name={elementName} placeholder={placeholderText} aria-label={placeholderText} value={elementValue} onChange={onChangeFunc} required />
        </div>
      ) : (
        <div className='userEmailContainer'>
          <input className='formInput' id={id} name={elementName} placeholder={placeholderText} aria-label={placeholderText} value={elementValue} onChange={onChangeFunc} type={elementType} required />
        </div>
      )}
    </>
  );
};

export default Contact;
