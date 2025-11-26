/**
 * @fileoverview This module imports various image and icon assets
 * and exports them as an object for easy access throughout the project.
 */

import moon_icon from "./moon_icon.svg";
import sun_icon from "./sun_icon.svg";
import hero1 from "./hero1.jpeg";
import hero2 from "./hero2.jpeg";
import hero3 from "./hero3.jpg";
import logo from "./logo.png";
import discord from "./discord.webp";
import github from "./github.png";
import google from "./google.png";
import camera from "./camera.png";
import micro from "./micro.png";
import end_call from "./end_call.webp";
import chat from "./chat.png";
import participants_logo from "./participants_logo.png";

/**
 * An object containing references to all imported image and icon assets.
 *
 * @namespace assets
 * @property {string} moon_icon - Icon representing the moon (dark mode).
 * @property {string} sun_icon - Icon representing the sun (light mode).
 * @property {string} hero1 - First hero section image.
 * @property {string} hero2 - Second hero section image.
 * @property {string} hero3 - Third hero section image.
 * @property {string} logo - Logo image of the application.
 * @property {string} discord - Discord logo image.
 * @property {string} github - GitHub logo image.
 * @property {string} google - Google logo image.
 * @property {string} camera - Camera icon image.
 * @property {string} micro - Microphone icon image.
 * @property {string} end_call - End call icon image.
 * @property {string} chat - Chat icon image.
 * @property {string} participants_logo - Icon representing participants.
 */
const assets = {
  moon_icon,
  sun_icon,
  hero1,
  hero2,
  hero3,
  logo,
  discord,
  github,
  google,
  camera,
  micro,
  end_call,
  chat,
  participants_logo,
};

export default assets;
