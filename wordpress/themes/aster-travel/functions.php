<?php
function aster_setup(){add_theme_support('title-tag');add_theme_support('post-thumbnails');add_theme_support('custom-logo');register_nav_menus(['primary'=>'Primary navigation']);}
add_action('after_setup_theme','aster_setup');
function aster_assets(){wp_enqueue_style('aster-style',get_stylesheet_uri(),[],wp_get_theme()->get('Version'));wp_enqueue_style('aster-mobile',get_template_directory_uri().'/mobile.css',['aster-style'],wp_get_theme()->get('Version'));}
add_action('wp_enqueue_scripts','aster_assets');
function aster_seed(){
  if(get_option('aster_seeded'))return;
  $pages=[
    'Home'=>['Welcome to Aster','Travel deeper with small-group journeys shaped around place, people, and unrushed discovery.'],
    'Journeys'=>['Travel with room to wonder.','Explore Himalayan Light, Desert & Stone, The Atlantic Edge, and private journeys designed around your pace.'],
    'Destinations'=>['Places with a story to tell.','Nepal, Jordan, Portugal, and Scotland—each researched in person and connected to exceptional local hosts.'],
    'About'=>['Travel should change your point of view.','Aster creates intimate, intelligent journeys that support local communities and leave room for real encounters.'],
    'Journal'=>['Stories from the road.','Field notes, destination guides, packing advice, and thoughtful ideas for traveling well.'],
    'Plan a Trip'=>['Tell us where your mind is wandering.','Share your destination, dates, group size, and the kind of experience you hope to have.']
  ];$ids=[];
  foreach($pages as $slug=>$data){$existing=get_page_by_path(sanitize_title($slug));$ids[$slug]=$existing?$existing->ID:wp_insert_post(['post_title'=>$data[0],'post_name'=>sanitize_title($slug),'post_content'=>'<!-- wp:paragraph {"fontSize":"large"} --><p class="has-large-font-size">'.esc_html($data[1]).'</p><!-- /wp:paragraph -->','post_status'=>'publish','post_type'=>'page']);}
  update_option('show_on_front','page');update_option('page_on_front',$ids['Home']);update_option('page_for_posts',$ids['Journal']);
  $menu=wp_create_nav_menu('Aster Primary');if(!is_wp_error($menu)){foreach(['Journeys','Destinations','About','Journal','Plan a Trip'] as $label)wp_update_nav_menu_item($menu,0,['menu-item-title'=>$label,'menu-item-object'=>'page','menu-item-object-id'=>$ids[$label],'menu-item-type'=>'post_type','menu-item-status'=>'publish']);$locations=get_theme_mod('nav_menu_locations',[]);$locations['primary']=$menu;set_theme_mod('nav_menu_locations',$locations);}
  update_option('aster_seeded',1);
}
add_action('after_switch_theme','aster_seed');
