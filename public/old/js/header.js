var  navList = document.querySelectorAll('.scrollToLink');
for (var i = 0; i<navList.length; i++){

navList[i].addEventListener('click', function(){
    navList[0].classList.remove('current')
    navList[1].classList.remove('current')
    navList[2].classList.remove('current')
    navList[3].classList.remove('current')
    navList[4].classList.remove('current')
    navList[5].classList.remove('current')
    this.classList.add('current')

})
}
