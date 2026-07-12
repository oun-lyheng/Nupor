const slugify = require('slugify')
const { users } = require('../models')
const crypto = require('crypto')

const generateUsername = async (fullName) => {
  let baseUsername = slugify(fullName, {
    lower: true,
    replacement: '_',
    strict: true
  })

  // handle edge case for Khmer names or empty slugs
  if (!baseUsername) {
    baseUsername = 'user'
  }

  let username = baseUsername
  let counter = 1
  const MAX_ATTEMPTS = 100 // prevent infinite loop

  while (counter <= MAX_ATTEMPTS) {
    const existing = await users.findOne({ where: { userName: username } })
    if (!existing) break
    username = `${baseUsername}${counter}`
    counter++
  }

  // fallback: append random suffix if all attempts exhausted
  if (counter > MAX_ATTEMPTS) {
    username = `${baseUsername}_${crypto.randomBytes(4).toString('hex')}`
  }

  return username
}

/**
 * Generate a cryptographically secure 4-digit OTP.
 * Uses crypto.randomInt instead of Math.random() to prevent predictability.
 */
const generateOtp = () => {
  return crypto.randomInt(1000, 9999).toString()
}

module.exports = {
  generateUsername,
  generateOtp
}
