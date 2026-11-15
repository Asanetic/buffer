// File: Components/Auth/LoginForm.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ProcessUserLogin } from '../../AuthUtils';
import { mosyGetLSData, mosySetLSData } from '../../../MosyUtils/hiveUtils';
import saAuthConfigs from '../../featureConfig/saAuthConfigs';
import { closeMosyModal, MosyAlertCard, MosyNotify } from '../../../MosyUtils/ActionModals';

import DynamicModalProvider from '../../../components/DynamicModalProvider';

function MainLoginInputs({
  appLogo,
  appName,
  changePasswordUrl,
  registerUrl,
  showResetLink,
  showCreateAccount,
}) {
  // Remembered usernames only — passwords are never stored.
  const savedKey = `${saAuthConfigs.sessionPrefix}_saved_logins`;
  const [savedLogins, setSavedLogins] = useState([]);
  const [username, setUsername] = useState('');
  const passwordRef = useRef(null);

  useEffect(() => {
    setSavedLogins(mosyGetLSData(savedKey, []) || []);
  }, [savedKey]);

  function pickSaved(name) {
    setUsername(name);
    passwordRef.current?.focus();
  }

  function forgetSaved(name) {
    const next = savedLogins.filter((n) => n !== name);
    mosySetLSData(savedKey, next);
    setSavedLogins(next);
  }

  async function sendLoginRequest(e) {
     MosyNotify({message : "Sending request...", addTimer:false})
      e.preventDefault();
      const typedName = username.trim();
      const loginResult = await ProcessUserLogin(e);

      if (loginResult.success) {
        if (typedName) {
          mosySetLSData(savedKey, [typedName, ...savedLogins.filter((n) => n !== typedName)].slice(0, 5));
        }
        console.log('Yay, logged in!', loginResult.user);
        closeMosyModal()
        
        // Maybe show a toast or do something UI-wise
      } else {
        console.log('Login failed:', loginResult.message);
        MosyNotify({message : "Invalid username or password. \nPlease try again",icon : "times-circle text-danger", duration:20000})
        // Maybe show custom message
      }
  }
  
  return (
    <div className="col-md-12 py-4">
      <div className="col-md-12 py-3 text-center">
        <img src={appLogo} alt="App Logo" style={{ width: '100px' }} />
      </div>

      <h4 className="col-md-12 mb-3 text-center">{appName}</h4>
      <p className="account-subtitle text-center">Login to proceed</p>

      {savedLogins.length > 0 && (
        <div className="mb-3">
          <small className="text-muted d-block mb-2">Choose a saved account</small>
          {savedLogins.map((name) => (
            <div
              key={name}
              className="d-flex align-items-center justify-content-between border rounded px-3 py-2 mb-2"
              style={{ cursor: 'pointer', background: name === username ? '#eef2ff' : 'transparent' }}
              onClick={() => pickSaved(name)}
            >
              <span><i className="fa fa-user mr-2" /> {name}</span>
              <span
                title="Remove"
                className="text-muted px-2"
                onClick={(ev) => { ev.stopPropagation(); forgetSaved(name); }}
              >&times;</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={sendLoginRequest} encType="multipart/form-data" id="mosy_form">
        <div className="form-group">
          <label htmlFor="txt_username">Username</label>
          <input
            className="form-control"
            required
            id="txt_username"
            name="txt_username"
            placeholder="Enter your username"
            type="text"
            value={username}
            onChange={(ev) => setUsername(ev.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="txt_password">Password</label>
          <input
            className="form-control"
            required
            id="txt_password"
            ref={passwordRef}
            name="txt_password"
            placeholder="Enter password"
            type="password"
          />
        </div>

        <div className="form-group">
          <button className="btn btn-primary btn-block w-100" name="btn_login" type="submit">
            Login
          </button>
        </div>

        <input type="hidden" id="auth_mosy_action" name="auth_mosy_action" value="auth_login" />
        <DynamicModalProvider/>
      </form>

      {showResetLink && (
        <div className="text-center pt-3">
          <Link href={changePasswordUrl}>Reset Password</Link>
        </div>
      )}

      {showCreateAccount && (
        <div className="text-center pt-4 text-dark">
          <Link href={registerUrl} className="text-dark">
            <b>New Here? Join {appName}</b>
          </Link>
        </div>
      )}
    </div>
  );
}

export default MainLoginInputs;
