<?php
function morrow_setup(){add_theme_support('title-tag');add_theme_support('post-thumbnails');add_theme_support('custom-logo');register_nav_menus(['primary'=>'Primary navigation']);}
add_action('after_setup_theme','morrow_setup');
function morrow_assets(){wp_enqueue_style('morrow-style',get_stylesheet_uri(),[],wp_get_theme()->get('Version'));wp_enqueue_style('morrow-mobile',get_template_directory_uri().'/mobile.css',['morrow-style'],wp_get_theme()->get('Version'));}
add_action('wp_enqueue_scripts','morrow_assets');
function morrow_seed(){
  if(get_option('morrow_seeded'))return;
  $pages=[
    'Home'=>['Coffee made slowly. Days made better.','Seasonal coffee, daily baking, and a comfortable corner of the city to call your own.'],
    'Menu'=>['The Morrow menu.','Coffee we care about, food made here, and a few good things that change with the season.'],
    'Our Story'=>['Good coffee, without the fuss.','Morrow is an independent neighborhood café built around generous hospitality, seasonal ingredients, and careful coffee.'],
    'Visit'=>['Find your new favorite corner.','Visit us at 18 Market Lane. Open weekdays 7am–6pm and weekends 8am–5pm.'],
    'Contact'=>['Coffee, questions, or a table for twelve?','Contact us for events, wholesale, press, group bookings, or general questions.']
  ];$ids=[];
  foreach($pages as $slug=>$data){$existing=get_page_by_path(sanitize_title($slug));$ids[$slug]=$existing?$existing->ID:wp_insert_post(['post_title'=>$data[0],'post_name'=>sanitize_title($slug),'post_content'=>'<!-- wp:paragraph {"fontSize":"large"} --><p class="has-large-font-size">'.esc_html($data[1]).'</p><!-- /wp:paragraph -->','post_status'=>'publish','post_type'=>'page']);}
  update_option('show_on_front','page');update_option('page_on_front',$ids['Home']);
  $menu=wp_create_nav_menu('Morrow Primary');if(!is_wp_error($menu)){foreach(['Menu','Our Story','Visit','Contact'] as $label)wp_update_nav_menu_item($menu,0,['menu-item-title'=>$label,'menu-item-object'=>'page','menu-item-object-id'=>$ids[$label],'menu-item-type'=>'post_type','menu-item-status'=>'publish']);$locations=get_theme_mod('nav_menu_locations',[]);$locations['primary']=$menu;set_theme_mod('nav_menu_locations',$locations);}
  update_option('morrow_seeded',1);
}
add_action('after_switch_theme','morrow_seed');
