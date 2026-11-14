<?php
/**
 * Plugin Name:       CMS Website Chatbot
 * Plugin URI:        https://www.cmspl.biz
 * Description:       The "Ask CMS" chat assistant: approved answers, AI-assisted replies, delivery estimates from the CMS rate card, and enquiries sent to the CMS sales team.
 * Version:           __VERSION__
 * Requires at least: 5.0
 * Requires PHP:      7.0
 * Author:            Channel Management Systems Pte Ltd
 * Author URI:        https://www.cmspl.biz
 * License:           Proprietary. (c) Channel Management Systems Pte Ltd. All rights reserved.
 * Text Domain:       cms-chatbot
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CMS_CHATBOT_VERSION', '__VERSION__' );

/**
 * Loads the chatbot on every front-end page, in the footer.
 * Settings can be changed without editing the script, for example to raise the button:
 *
 *   add_filter( 'cms_chatbot_settings', function ( $s ) { $s['lift'] = 80; return $s; } );
 *
 * Available keys: side ("right" or "left"), lift (pixels), nudgeAfter (seconds, 0 = off), careersUrl.
 */
function cms_chatbot_enqueue() {
	if ( is_admin() ) {
		return;
	}
	wp_enqueue_script(
		'cms-chatbot',
		plugins_url( 'assets/cms-chatbot.js', __FILE__ ),
		array(),
		CMS_CHATBOT_VERSION,
		true
	);
	$settings = apply_filters( 'cms_chatbot_settings', array() );
	if ( is_array( $settings ) && ! empty( $settings ) ) {
		wp_add_inline_script( 'cms-chatbot', 'window.CMS_CHAT_SETTINGS=' . wp_json_encode( $settings ) . ';', 'before' );
	}
}
add_action( 'wp_enqueue_scripts', 'cms_chatbot_enqueue' );
