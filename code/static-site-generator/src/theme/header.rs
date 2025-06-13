/// Generate JavaScript for header interactions.
///
/// The script handles mobile menu toggling and shrinking the
/// header when the page is scrolled.
pub fn generate_header_script() -> String {
    let js = r"// Header interactions for para-ssg
(function(){
    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.nav-toggle');
    if(toggle){
        toggle.addEventListener('click', () => header.classList.toggle('open'));
    }
    window.addEventListener('scroll', () => {
        if(window.scrollY > 40){
            document.body.classList.add('scrolled');
        } else {
            document.body.classList.remove('scrolled');
        }
    });
})();";
    js.to_string()
}
