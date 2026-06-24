const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
const server = fs.readFileSync(serverPath, 'utf8');

// Remove the duplicate express import at the end
const lines = server.split('\n');
const filtered = lines.filter((line, i) => {
  // Remove lines 980+ which are the duplicate imports from the verification file
  if (i >= 978 && line.includes("const express = require('express')")) return false;
  if (i >= 978 && line.includes("const bcrypt = require('bcryptjs')")) return false;
  if (i >= 978 && line.includes("const jwt = require('jsonwebtoken')")) return false;
  if (i >= 978 && line.includes("const crypto = require('crypto')")) return false;
  if (i >= 978 && line.includes("const nodemailer = require('nodemailer')")) return false;
  if (i >= 978 && line.includes("const transporter = nodemailer.createTransport")) return false;
  if (i >= 978 && line.includes("function generateVerificationToken")) return false;
  if (i >= 978 && line.includes("async function sendVerificationEmail")) return false;
  return true;
});

fs.writeFileSync(serverPath, filtered.join('\n'));
console.log('OK - removed duplicate imports');
