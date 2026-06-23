<?php
function northstar_setup(){add_theme_support('title-tag');add_theme_support('post-thumbnails');add_theme_support('custom-logo');register_nav_menus(['primary'=>'Primary navigation']);}
add_action('after_setup_theme','northstar_setup');
function northstar_assets(){wp_enqueue_style('northstar-style',get_stylesheet_uri(),[],wp_get_theme()->get('Version'));}
add_action('wp_enqueue_scripts','northstar_assets');
function northstar_seed(){
 if(get_option('northstar_seeded'))return;
 $pages=[
  'Home'=>['Freight that keeps business moving.','Road, air, and ocean solutions backed by hands-on coordination and clear shipment visibility.'],
  'Services'=>['One partner across your supply chain.','Road freight, air cargo, ocean freight, warehousing, customs brokerage, and project logistics.'],
  'Coverage'=>['Connected where your business needs us.','A partner network across 42 markets, 12 regional hubs, and five primary trade corridors.'],
  'Tracking'=>['Track your freight.','Enter a Northstar reference, bill of lading, container number, or purchase order to view milestones.'],
  'Company'=>['Logistics built on clear commitments.','Since 2008, Northstar has helped manufacturers, retailers, and project teams move critical freight with confidence.'],
  'Get a Quote'=>['Tell us what needs to move.','Share the origin, destination, cargo, timing, and handling requirements for an operational review.']
 ];$ids=[];
 foreach($pages as $slug=>$data){$existing=get_page_by_path(sanitize_title($slug));$ids[$slug]=$existing?$existing->ID:wp_insert_post(['post_title'=>$data[0],'post_name'=>sanitize_title($slug),'post_content'=>'<!-- wp:paragraph {"fontSize":"large"} --><p class="has-large-font-size">'.esc_html($data[1]).'</p><!-- /wp:paragraph -->','post_status'=>'publish','post_type'=>'page']);}
 update_option('show_on_front','page');update_option('page_on_front',$ids['Home']);
 $menu=wp_create_nav_menu('Northstar Primary');if(!is_wp_error($menu)){foreach(['Services','Coverage','Tracking','Company','Get a Quote'] as $label)wp_update_nav_menu_item($menu,0,['menu-item-title'=>$label,'menu-item-object'=>'page','menu-item-object-id'=>$ids[$label],'menu-item-type'=>'post_type','menu-item-status'=>'publish']);$locations=get_theme_mod('nav_menu_locations',[]);$locations['primary']=$menu;set_theme_mod('nav_menu_locations',$locations);}
 update_option('northstar_seeded',1);
}
add_action('after_switch_theme','northstar_seed');
