import Album from '../components/Album'

function Main() {
    return (
        <>
            <main className="main">
                <section className="topBar">
                    <button className="backArrow"><img src="../../public/images/Arrow.svg" alt="" className="arrowImage" /></button>
                    <h1 className="pageHeader">WHOSE DEBUT?</h1>
                </section>
                <div className="divider"></div>
                <section className="topThree">
                    <Album type={null}/>
                    <Album type={null}/>
                    <Album type={null}/>
                </section>
                <section className="bottomBar">
                    <a href="" className="contactLink">Are you releasing an album? Click here!</a>
                    <button className="scrollArrow"><img src="../../public/images/Arrow.svg" alt="" className="arrowImage" /></button>
                </section>
            </main>
            <section>
                <main className="stillFresh">
                    <section className="topBar">
                        <button className="backArrow"><img src="../../public/images/Arrow.svg" alt="" className="arrowImage" /></button>
                        <h1 className="pageHeader">STILL FRESH</h1>
                    </section>
                    <div className="divider"></div>
                    <section className="stillFreshAlbums">
                        <Album type='stillFresh'/>
                        <Album type='stillFresh'/>
                        <Album type='stillFresh'/>
                        <Album type='stillFresh'/>
                        <Album type='stillFresh'/>
                        <Album type='stillFresh'/>
                        <Album type='stillFresh'/>
                        <Album type='stillFresh'/>
                        <Album type='stillFresh'/>
                        <Album type='stillFresh'/>
                    </section>
                    <section className="bottomBar">
                        <a href="" className="contactLink">Are you releasing an album? Click here!</a>
                        <button className="scrollArrow"><img src="../../public/images/Arrow.svg" alt="" className="arrowImage" /></button>
                    </section>
                </main>
            </section>
        </>

    );
}

export default Main;