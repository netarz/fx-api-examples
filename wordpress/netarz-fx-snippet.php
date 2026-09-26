<?php
/**
 * Minimal WordPress snippet (theme functions.php or a mu-plugin):
 * [netarz_usd] prints the dollar sell rate in Toman.
 *
 * For a complete plugin with a settings page, a widget, caching and
 * translations, see https://github.com/netarz/netarz-fx-wordpress
 *
 * In wp-config.php:  define( 'NETARZ_FX_KEY', 'fx-ntz-v1-...' );
 * The site's outgoing IP must be allow-listed on the app in https://netarz.ir/fx
 */

add_shortcode( 'netarz_usd', function () {
	$cached = get_transient( 'netarz_fx_usd' );
	if ( false === $cached ) {
		$response = wp_remote_get(
			'https://netarz.ir/api/fx/v1/rates/USD',
			array(
				'timeout' => 10,
				'headers' => array( 'Authorization' => 'Bearer ' . NETARZ_FX_KEY ),
			)
		);
		$body = is_wp_error( $response ) ? null : json_decode( wp_remote_retrieve_body( $response ), true );

		if ( empty( $body['data']['sell'] ) ) {
			// Keep the last good value for a while instead of showing nothing.
			$cached = get_option( 'netarz_fx_usd_last', '' );
		} else {
			$cached = number_format_i18n( $body['data']['sell'] ) . ' تومان';
			update_option( 'netarz_fx_usd_last', $cached, false );
		}
		set_transient( 'netarz_fx_usd', $cached, 5 * MINUTE_IN_SECONDS );
	}

	return '<span class="netarz-usd">' . esc_html( $cached ) . '</span>';
} );
