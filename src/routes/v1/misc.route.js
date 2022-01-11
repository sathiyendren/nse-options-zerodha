const express = require('express');
const miscController = require('../../controllers/misc.controller');

const router = express.Router();

router.get('/ping', miscController.ping);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Misc
 *   description: Miscellaneous
 */

/**
 * @swagger
 * /ping:
 *   post:
 *     summary: Ping the server
 *     description: checking server health.
 *     tags: [Auth]
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
