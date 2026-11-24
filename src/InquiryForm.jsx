import React, {useEffect, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Mail, MessageCircle} from 'lucide-react';
import {email, listings, whatsapp} from './routes.js';

export default function InquiryForm() {
  const [reference, setReference] = useState('');
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('property');
    if (value && listings.some(item => item.id === value)) setReference(value);
  }, []);

  function send(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const topic = form.get('topic');
    const lines = [
      'Hello Mavi Real Estate,', '',
      'I’m interested in ' + topic.toLowerCase() + '.',
      ...(reference.trim() ? ['Property reference: ' + reference.trim()] : []),
      form.get('message').trim(), '',
      form.get('name').trim(),
    ];
    const message = lines.join('\n');
    const subject = 'Kalkan Property inquiry' + (reference.trim() ? ' · ' + reference.trim() : '');
    window.location.href = event.nativeEvent.submitter?.value === 'email'
      ? 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message)
      : whatsapp(message);
  }

  return <form className="inquiry-form" onSubmit={send}>
    <div className="inquiry-fields">
      <label>Your name<input name="name" autoComplete="name" required maxLength={100}/></label>
      <label>What can we help with?
        <select name="topic" defaultValue="Arranging a viewing">
          {['Arranging a viewing','Buying a property','Renting a property','Selling a property','A property valuation','Property services'].map(topic => <option key={topic}>{topic}</option>)}
        </select>
      </label>
    </div>
    <label>Property reference <span>(optional)</span>
      <input name="reference" value={reference} onChange={event => setReference(event.target.value)} maxLength={30}/>
    </label>
    <label>Your message<textarea name="message" required rows={5} maxLength={1400} placeholder="Tell us your preferred area, budget or viewing dates."/></label>
    <p className="inquiry-help">Your message opens in WhatsApp or your email app for you to send.</p>
    <div className="inquiry-actions">
      <Button type="submit" value="whatsapp" label="Open in WhatsApp" className="action" variant="primary" icon={<MessageCircle size={17}/>}/>
      <Button type="submit" value="email" label="Open in email" className="quiet-action" icon={<Mail size={17}/>}/>
    </div>
  </form>;
}
